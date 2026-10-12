export type ActionSource = "idle" | "battle";
export interface ActiveAction<T> {
  card: T;
  interactType: number;
  response: number;
  activateIndex?: number;
  directAttackAble?: boolean;
}
interface ActionRequest<T> {
  source: ActionSource;
  actions: ActiveAction<T>[];
  phases: Partial<Record<string, number>>;
}
interface ActionAdapter<T> {
  eligible: () => boolean;
  send: (source: ActionSource, response: number) => boolean;
  chooseCard: (cards: T[], signal: AbortSignal) => Promise<T | undefined>;
  chooseEffect: (
    actions: ActiveAction<T>[],
    signal: AbortSignal,
  ) => Promise<number | undefined>;
  confirmSingleAction?: (action: ActiveAction<T>) => boolean;
  clear: () => void;
}
interface CurrentRequest<T> extends ActionRequest<T> {
  id: number;
  adapter: ActionAdapter<T>;
  controller: AbortController;
  submitted: boolean;
}

/** 所有卡片、效果和阶段入口共用请求身份、取消与一次性提交规则。 */
export class ActiveActionProcess<T> {
  private generation = 0;
  private current?: CurrentRequest<T>;

  open(request: ActionRequest<T>, adapter: ActionAdapter<T>) {
    this.reset();
    this.current = {
      ...request,
      actions: request.actions.map((action) => ({ ...action })),
      phases: { ...request.phases },
      id: ++this.generation,
      adapter,
      controller: new AbortController(),
      submitted: false,
    };
    return this.current.id;
  }

  options(cards: readonly T[]) {
    const request = this.current;
    if (!request || !this.isCurrent(request)) return [];
    const candidates = new Set(cards);
    const types = new Set(
      request.actions
        .filter((action) => candidates.has(action.card))
        .map((action) => action.interactType),
    );
    return [...types].map((interactType) => {
      const actions = request.actions.filter(
        (action) =>
          action.interactType === interactType && candidates.has(action.card),
      );
      const cards = [...new Set(actions.map((action) => action.card))];
      return {
        interactType,
        cards,
        responseSource: request.source,
        response: actions.length === 1 ? actions[0].response : undefined,
        choose: () => this.choose(request, actions, cards),
      };
    });
  }

  phases(currentPhase?: string) {
    const request = this.current;
    if (!request || !this.isCurrent(request)) return [];
    return Object.keys(request.phases).filter((id) => id !== currentPhase);
  }

  submitPhase(
    requestId: number | undefined,
    phase: string,
    currentPhase?: string,
  ) {
    const request = this.current;
    if (!request || request.id !== requestId || phase === currentPhase)
      return false;
    const response = request.phases[phase];
    return response !== undefined && this.submit(request, response);
  }

  reset() {
    const request = this.current;
    this.current = undefined;
    request?.controller.abort();
    request?.adapter.clear();
  }

  private isCurrent(request: CurrentRequest<T>) {
    return (
      this.current === request &&
      !request.submitted &&
      request.adapter.eligible()
    );
  }

  private async choose(
    request: CurrentRequest<T>,
    actions: ActiveAction<T>[],
    cards: T[],
  ) {
    if (!this.isCurrent(request)) return false;
    const signal = request.controller.signal;
    const card =
      cards.length === 1
        ? cards[0]
        : await request.adapter.chooseCard(cards, signal);
    if (!this.isCurrent(request) || card === undefined) return false;
    const choices = actions.filter((action) => action.card === card);
    if (!choices.length) return false;
    const response =
      choices.length === 1 &&
      !(cards.length === 1 && request.adapter.confirmSingleAction?.(choices[0]))
        ? choices[0].response
        : await request.adapter.chooseEffect(choices, signal);
    if (
      response === undefined ||
      !choices.some((action) => action.response === response)
    )
      return false;
    return this.submit(request, response);
  }

  private submit(request: CurrentRequest<T>, response: number) {
    if (!this.isCurrent(request)) return false;
    // 先占用提交资格，发送过程中的同步回调也不能重复提交。
    request.submitted = true;
    let sent = false;
    try {
      sent = request.adapter.send(request.source, response);
      if (sent && this.current === request) this.reset();
      return sent;
    } finally {
      if (!sent && this.current === request) request.submitted = false;
    }
  }
}

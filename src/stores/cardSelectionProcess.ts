import { proxy } from "valtio";

import type { CardSelectionRequest } from "./cardSelectionTypes";
import {
  canCompleteSelection,
  type SelectionValue,
  validSelection,
} from "./selectionRules.ts";

type Candidate = SelectionValue & { response?: number; selected?: boolean };
export type SelectionResponse =
  | { kind: "single"; value: number }
  | { kind: "multiple"; values: number[] };
export interface SelectionCompletion<T> {
  cards: readonly T[];
  response?: SelectionResponse;
}

/** 选卡的状态、合法性、响应与等待；呈现方式不参与这些规则。 */
export class CardSelectionProcess<T extends Candidate> {
  readonly state = proxy({
    active: false,
    request: undefined as CardSelectionRequest<T> | undefined,
    // 只记录本次勾选在 selectables 中的索引，不预填服务器累计已选的卡。
    selected: [] as number[],
    valid: false,
  });
  private complete?: (result: SelectionCompletion<T>) => void;
  private resolve?: (cards: readonly T[]) => void;

  open(
    request: CardSelectionRequest<T>,
    complete?: (result: SelectionCompletion<T>) => void,
  ) {
    // 新请求替换旧请求时，先结束旧等待，避免消息处理一直停在上一轮选卡。
    this.reset();
    this.state.request = request;
    this.state.selected = [];
    this.state.active = true;
    this.complete = complete;
    this.refreshValidity();
    return new Promise<readonly T[]>((resolve) => {
      this.resolve = resolve;
    });
  }

  toggle(index: number) {
    const request = this.state.request;
    if (!this.state.active || !request?.selectables[index]) return;
    const selected = this.state.selected;
    if (selected.includes(index))
      this.state.selected = selected.filter((value) => value !== index);
    else if (this.replacesSelection()) this.state.selected = [index];
    else selected.push(index);
    this.refreshValidity();
  }

  canChoose(index: number) {
    const request = this.state.request;
    if (!this.state.active || !request?.selectables[index]) return false;
    if (this.state.selected.includes(index) || request.single) return true;
    // 多选候选只有还能补成合法组合时才可选；单选替换时重新计算组合。
    const next = this.replacesSelection()
      ? [request.selectables[index]]
      : [...this.chosen(), request.selectables[index]];
    const remaining = request.selectables.filter(
      (_, i) =>
        i !== index &&
        (this.replacesSelection() || !this.state.selected.includes(i)),
    );
    return canCompleteSelection(next, remaining, request.mustSelects, request);
  }

  submit() {
    const request = this.state.request;
    if (!this.state.active || !request || !this.state.valid) return;
    // 必选卡参与最终响应，但不加入可由玩家切换的本次勾选。
    const cards = [...request.mustSelects, ...this.chosen()];
    this.finish({
      cards,
      // 连锁使用单值响应；普通和逐张选卡使用候选序号数组。
      response: request.isChain
        ? { kind: "single", value: cards[0].response! }
        : { kind: "multiple", values: cards.map((card) => card.response!) },
    });
  }

  quickSubmit(index: number) {
    const request = this.state.request;
    const option = request?.selectables[index];
    if (
      !this.state.active ||
      !request ||
      !option ||
      !(request.single || request.max === 1) ||
      !validSelection([option], request.mustSelects, request)
    )
      return;
    this.state.selected = [index];
    this.refreshValidity();
    this.submit();
  }

  cancel() {
    if (this.state.active && this.state.request?.cancelable)
      this.finish({ cards: [], response: { kind: "single", value: -1 } });
  }

  finishSelection() {
    // 结束累计选择和取消都发送 -1，但是否允许由各自的协议标志决定。
    if (this.state.active && this.state.request?.finishable)
      this.finish({ cards: [], response: { kind: "single", value: -1 } });
  }

  /** 请求替换或离开对局时只释放等待，不向服务器发送取消响应。 */
  reset() {
    this.finish({ cards: [] });
  }

  private chosen() {
    const request = this.state.request!;
    return this.state.selected.map((index) => request.selectables[index]);
  }

  private replacesSelection() {
    const request = this.state.request!;
    // sum-greater 按贡献值和最小组合判断，不能把 max === 1 当作单选。
    return (
      request.single ||
      (request.max === 1 &&
        !(request.selectionKind === "sum" && request.overflow))
    );
  }

  private refreshValidity() {
    const request = this.state.request!;
    this.state.valid = validSelection(
      this.chosen(),
      request.mustSelects,
      request,
    );
  }

  private finish(result: SelectionCompletion<T>) {
    const complete = this.complete;
    const resolve = this.resolve;
    // 回调可能立即开启下一次选卡，先清理当前状态以免覆盖新请求。
    this.complete = undefined;
    this.resolve = undefined;
    this.state.active = false;
    this.state.request = undefined;
    this.state.selected = [];
    this.state.valid = false;
    try {
      complete?.(result);
    } finally {
      // 即使响应回调抛出异常，也要释放等待本次选卡的消息处理函数。
      resolve?.(result.cards);
    }
  }
}

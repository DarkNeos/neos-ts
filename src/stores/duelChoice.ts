import { createDuelDialog } from "./duelDialogs.ts";

interface ChoiceRequest<T> {
  respond(value: T): boolean;
  eligible?(): boolean;
  validate?(value: T): boolean;
  signal?: AbortSignal;
}

/** 每次选择独立拥有提交、取消和等待结果，发送失败后仍可重试。 */
export class DuelChoice<T> {
  private sequence = 0;
  private current?: ChoiceRequest<T> & {
    id: number;
    submitting: boolean;
    abort: () => void;
  };
  private dialog: ReturnType<typeof createDuelDialog<T | undefined>>;

  constructor(close: () => void) {
    this.dialog = createDuelDialog<T | undefined>(() => {
      const request = this.current;
      this.current = undefined;
      request?.signal?.removeEventListener("abort", request.abort);
      close();
    }, undefined);
  }

  open(options: ChoiceRequest<T>) {
    if (options.signal?.aborted) return;
    this.dialog.finish();
    const request = {
      ...options,
      id: ++this.sequence,
      submitting: false,
      abort: () => {
        if (this.current === request) this.dialog.finish();
      },
    };
    this.current = request;
    const result = this.dialog.wait();
    request.signal?.addEventListener("abort", request.abort, { once: true });
    return { id: request.id, result };
  }

  submit(value: T, id: number): boolean {
    const request = this.current;
    if (
      !request ||
      request.id !== id ||
      request.submitting ||
      request.signal?.aborted ||
      request.eligible?.() === false ||
      request.validate?.(value) === false
    )
      return false;
    request.submitting = true;
    try {
      if (!request.respond(value) || this.current !== request) return false;
      this.dialog.finish(value);
      return true;
    } finally {
      if (this.current === request) request.submitting = false;
    }
  }
}

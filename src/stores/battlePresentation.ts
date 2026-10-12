/** 仅在命中时提前放行紧随战斗的伤害，其他动作仍等待卡片归位。 */
export class BattlePresentation {
  private pending?: {
    controller: AbortController;
    done: Promise<void>;
    allowDamage: boolean;
  };

  async play(
    animate: (signal: AbortSignal, impact: () => void) => Promise<void>,
  ): Promise<void> {
    this.cancel();
    const controller = new AbortController();
    let impact!: () => void;
    const hit = new Promise<void>((resolve) => {
      impact = resolve;
    });
    const cancelled = new Promise<void>((resolve) => {
      controller.signal.addEventListener(
        "abort",
        () => {
          impact();
          resolve();
        },
        { once: true },
      );
    });
    const pending = { controller, done: Promise.resolve(), allowDamage: true };
    this.pending = pending;
    pending.done = Promise.race([
      Promise.resolve().then(() => animate(controller.signal, impact)),
      cancelled,
    ])
      .catch((error) => {
        console.warn("战斗演出未完成", error);
      })
      .finally(() => {
        impact();
        if (this.pending === pending) this.pending = undefined;
      });
    await hit;
  }

  async beforeMessage(transparent: boolean, damage: boolean): Promise<void> {
    const pending = this.pending;
    if (!pending || transparent) return;
    if (damage && pending.allowDamage) {
      pending.allowDamage = false;
      return;
    }
    await pending.done;
  }

  cancel(): void {
    this.pending?.controller.abort();
    this.pending = undefined;
  }
}

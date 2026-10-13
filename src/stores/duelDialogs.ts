// 弹窗状态独立于场上数据，退出对局时需要一起清理。
const resets = new Map<() => void, boolean>();

export function registerDuelDialogReset(
  reset: () => void,
  // 结算弹窗可在意外断线后保留；主动退出仍会统一关闭。
  preserveOnDisconnect = false,
) {
  resets.set(reset, preserveOnDisconnect);
  return () => {
    resets.delete(reset);
  };
}

export function resetDuelDialogs(preserveResult = false) {
  resets.forEach((preserve, reset) => {
    if (!preserveResult || !preserve) reset();
  });
}

export function createDuelDialog<T = void>(
  close: () => void,
  cancelledValue: T,
  preserveOnDisconnect = false,
) {
  let resolve: ((value: T) => void) | undefined;
  const finish = (value: T = cancelledValue) => {
    const pending = resolve;
    // 先清空等待句柄，重复关闭或同步触发 reset 时只完成一次。
    resolve = undefined;
    close();
    pending?.(value);
  };
  registerDuelDialogReset(() => finish(cancelledValue), preserveOnDisconnect);
  return {
    wait: () =>
      new Promise<T>((done) => {
        // 新弹窗替换旧弹窗时也必须结束旧等待，避免阻塞协议消息队列。
        resolve?.(cancelledValue);
        resolve = done;
      }),
    finish,
  };
}

import { EventEmitter } from "eventemitter3";
import { v4 as v4uuid } from "uuid";

import { replayPresentation } from "./replayPresentation";

const eventEmitter = new EventEmitter();

export enum Task {
  Move = "move", // 卡片移动
  Focus = "focus", // 卡片聚焦
  Confirm = "confirm", // 公开卡片
  Shuffle = "shuffle", // 卡组洗牌
  Attack = "attack", // 卡片攻击
  Mora = "mora", // 猜拳
  Tp = "tp", // 选边
}

const getEnd = (task: Task) => `${task}-end`;

/** 在组件之中注册方法，注意注册的方法一旦执行成功，必须返回一个true */
const register = <T extends unknown[]>(
  task: Task,
  fn: (...args: T) => Promise<boolean>,
) => {
  const listener = async ({ taskId, args }: { taskId: string; args: T }) => {
    const result = await fn(...args);
    if (result) eventEmitter.emit(getEnd(task), taskId);
  };
  eventEmitter.on(task, listener);
  return () => {
    eventEmitter.off(task, listener);
  };
};

/** 在service之中调用组件中的方法 */
const call = (task: Task, ...args: any[]) =>
  new Promise<void>((rs) => {
    // 定位重建时牌面暂时卸载，跳过演出等待，协议状态才能继续重建。
    if (replayPresentation.seeking) {
      rs();
      return;
    }
    const taskId = v4uuid();
    const cb = (respTaskId: string) => {
      // 同类动画可以并行，只有本次任务的结束事件才能释放对应等待。
      if (respTaskId === taskId) {
        eventEmitter.removeListener(getEnd(task), cb);
        rs();
      }
    };
    eventEmitter.on(getEnd(task), cb);
    eventEmitter.emit(task, { taskId, args });
  });

export const eventbus = {
  call,
  register,
  on: eventEmitter.on.bind(eventEmitter),
  off: eventEmitter.off.bind(eventEmitter),
  once: eventEmitter.once.bind(eventEmitter),
  emit: eventEmitter.emit.bind(eventEmitter),
};

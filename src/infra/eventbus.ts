import { EventEmitter } from "eventemitter3";
import { v4 as v4uuid } from "uuid";

const eventEmitter = new EventEmitter();

export enum Task {
  Move = "move", // 卡片移动
  Focus = "focus", // 卡片聚焦
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
  eventEmitter.on(
    task,
    async ({ taskId, args }: { taskId: string; args: T }) => {
      const result = await fn(...args);
      if (result) eventEmitter.emit(getEnd(task), taskId);
    },
  );
};

/** 在service之中调用组件中的方法 */
const call = (task: Task, ...args: any[]) =>
  new Promise<void>((rs) => {
    const taskId = v4uuid();
    const cb = (respTaskId: string) => {
      if (respTaskId === taskId) {
        eventEmitter.removeListener(getEnd(task), cb);
        rs();
      }
    };
    eventEmitter.emit(task, { taskId, args });
    eventEmitter.on(getEnd(task), cb);
  });

export const eventbus = {
  call,
  register,
  on: eventEmitter.on.bind(eventEmitter),
  off: eventEmitter.off.bind(eventEmitter),
  once: eventEmitter.once.bind(eventEmitter),
  emit: eventEmitter.emit.bind(eventEmitter),
};

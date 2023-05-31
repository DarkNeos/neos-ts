import { EventEmitter } from "eventemitter3";
import { v4 as v4uuid } from "uuid";

const eventEmitter = new EventEmitter();

export enum Task {
  Move = "move",
  Chaining = "chaining",
}

const getEnd = (task: Task) => `${task}-end`;

/** 在组件之中注册方法 */
const register = (task: Task, fn: (...args: any[]) => Promise<any>) => {
  eventEmitter.on(
    task,
    async ({ taskId, args }: { taskId: string; args: any[] }) => {
      await fn(...args);
      eventEmitter.emit(getEnd(task), taskId);
    }
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
};

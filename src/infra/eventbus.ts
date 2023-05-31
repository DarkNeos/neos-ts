import { EventEmitter } from "eventemitter3";
import { v4 as v4uuid } from "uuid";

const eventEmitter = new EventEmitter();

export enum Task {
  Move = "move",
  Chaining = "chaining",
}

const getEnd = (task: Task) => `${task}-end`;

const register = (task: Task, fn: (...args: any[]) => Promise<any>) => {
  eventEmitter.on(
    task,
    async ({ taskId, args }: { taskId: string; args: any[] }) => {
      await fn(...args);
      eventEmitter.emit(getEnd(task), taskId);
    }
  );
};

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

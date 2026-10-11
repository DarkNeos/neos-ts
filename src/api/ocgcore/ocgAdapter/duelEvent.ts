import type { ygopro } from "../idl/ocgcore";

/** 原 protobuf 未定义的辅助消息，由适配层直接交给对局服务处理。 */
export type DuelEvent =
  | {
      kind: "card-hint";
      location: ygopro.CardLocation;
      type: number;
      value: number;
    }
  | { kind: "player-hint"; player: number; type: number; value: number }
  | { kind: "chain-result"; index: number; result: "activation" | "effect" };

export type DuelGameMessage = ygopro.StocGameMessage & {
  duelEvent?: DuelEvent;
};

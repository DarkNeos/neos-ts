import type { ygopro } from "../idl/ocgcore";

export interface BattleCard {
  location: ygopro.CardLocation;
  attack: number;
  defense: number;
  battleState: number;
}

/** 原 protobuf 未定义的辅助消息，由适配层直接交给对局服务处理。 */
export type DuelEvent =
  | {
      kind: "card-hint";
      location: ygopro.CardLocation;
      type: number;
      value: number;
    }
  | { kind: "player-hint"; player: number; type: number; value: number }
  | { kind: "chain-result"; index: number; result: "activation" | "effect" }
  | { kind: "chain-stage"; index: number; stage: "built" | "solving" }
  | { kind: "battle"; attacker: BattleCard; defender?: BattleCard }
  | { kind: "damage-step"; start: boolean };

export type DuelGameMessage = ygopro.StocGameMessage & {
  duelEvent?: DuelEvent;
  hpSource?: "cost";
};

/** 扩展消息也保留录像的动作名称，正式战斗与攻击宣言使用同一推进标记。 */
export function duelMessageName(message: DuelGameMessage): string | undefined {
  return message.duelEvent?.kind === "battle" ? "battle" : message.gameMsg;
}

import { proxy } from "valtio";

import { ygopro } from "@/api";
import { Context } from "@/container";

import { NeosStore } from "./shared";

export enum HistoryOp {
  MOVE = 1,
  EFFECT = 2,
  TARGETED = 3,
  CONFIRMED = 4,
  ATTACK = 5, // TODO
  SUMMON = 6,
  SP_SUMMON = 7,
  FLIP_SUMMON = 8,
  SET = 9,
  HINT = 10,
}

export interface History {
  card: number;
  opponent: boolean;
  currentLocation?: ygopro.CardLocation;
  operation: HistoryOp;
  target?: ygopro.CardLocation;
  text?: string;
  player?: number;
  chainIndex?: number;
}

export class HistoryStore implements NeosStore {
  historys: History[] = [];

  putMove(
    context: Context,
    card: number,
    from: ygopro.CardLocation,
    to: ygopro.CardLocation,
  ) {
    // TODO: Refinement
    this.historys.push({
      card,
      opponent: !context.matStore.isMe(from.controller),
      currentLocation: new ygopro.CardLocation(from.toObject()),
      operation: HistoryOp.MOVE,
      target: new ygopro.CardLocation(to.toObject()),
    });
  }

  putEffect(context: Context, card: number, location: ygopro.CardLocation) {
    this.historys.push({
      card,
      opponent: !context.matStore.isMe(location.controller),
      currentLocation: location,
      operation: HistoryOp.EFFECT,
    });
  }

  putTargeted(
    context: Context,
    card: number,
    location: ygopro.CardLocation,
    chainIndex?: number,
  ) {
    this.historys.push({
      card,
      opponent: !context.matStore.isMe(location.controller),
      currentLocation: location,
      operation: HistoryOp.TARGETED,
      chainIndex,
    });
  }

  putHint(context: Context, player: number, text: string, card = 0) {
    this.historys.push({
      card,
      player,
      text,
      operation: HistoryOp.HINT,
      opponent: !context.matStore.isMe(player),
    });
  }

  putConfirmed(context: Context, card: number, location: ygopro.CardLocation) {
    this.historys.push({
      card,
      opponent: !context.matStore.isMe(location.controller),
      currentLocation: location,
      operation: HistoryOp.CONFIRMED,
    });
  }

  putSummon(context: Context, card: number, location: ygopro.CardLocation) {
    this.historys.push({
      card,
      opponent: !context.matStore.isMe(location.controller),
      operation: HistoryOp.SUMMON,
    });
  }

  putSpSummon(context: Context, card: number, location: ygopro.CardLocation) {
    this.historys.push({
      card,
      opponent: !context.matStore.isMe(location.controller),
      operation: HistoryOp.SP_SUMMON,
    });
  }

  putFlipSummon(context: Context, card: number, location: ygopro.CardLocation) {
    this.historys.push({
      card,
      opponent: !context.matStore.isMe(location.controller),
      operation: HistoryOp.FLIP_SUMMON,
    });
  }

  putSet(context: Context, card: number, location: ygopro.CardLocation) {
    this.historys.push({
      card,
      opponent: !context.matStore.isMe(location.controller),
      operation: HistoryOp.SET,
      // 保存盖放当时的位置，后续移位、洗切或翻开不会改写历史。
      target: new ygopro.CardLocation(location.toObject()),
    });
  }

  reset(): void {
    this.historys = [];
  }
}

export const historyStore = proxy(new HistoryStore());

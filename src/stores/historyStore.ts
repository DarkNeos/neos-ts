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
}

export interface History {
  card: number;
  opponent: boolean;
  currentLocation?: ygopro.CardLocation;
  operation: HistoryOp;
  target?: ygopro.CardZone;
}

export class HistoryStore implements NeosStore {
  historys: History[] = [];

  putMove(
    context: Context,
    card: number,
    from: ygopro.CardLocation,
    to: ygopro.CardZone,
  ) {
    // TODO: Refinement
    this.historys.push({
      card,
      opponent: !context.matStore.isMe(from.controller),
      currentLocation: from,
      operation: HistoryOp.MOVE,
      target: to,
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

  putTargeted(context: Context, card: number, location: ygopro.CardLocation) {
    this.historys.push({
      card,
      opponent: !context.matStore.isMe(location.controller),
      currentLocation: location,
      operation: HistoryOp.TARGETED,
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
      target: location.zone,
    });
  }

  reset(): void {
    this.historys = [];
  }
}

export const historyStore = proxy(new HistoryStore());

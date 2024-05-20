import { ygopro } from "@/api";
import { AudioActionType, playEffect } from "@/infra/audio";
import { matStore } from "@/stores";

export default (newTurn: ygopro.StocGameMessage.MsgNewTurn) => {
  playEffect(AudioActionType.SOUND_NEXT_TURN);
  const player = newTurn.player;
  matStore.currentPlayer = player;
};

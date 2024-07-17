import { ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";

export default (
  container: Container,
  newTurn: ygopro.StocGameMessage.MsgNewTurn,
) => {
  playEffect(AudioActionType.SOUND_NEXT_TURN);
  const context = container.context;
  const player = newTurn.player;
  context.matStore.currentPlayer = player;
  context.matStore.turnCount = context.matStore.turnCount + 1;
};

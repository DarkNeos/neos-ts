import { ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";

export default (
  container: Container,
  newPhase: ygopro.StocGameMessage.MsgNewPhase,
) => {
  playEffect(AudioActionType.SOUND_PHASE);
  // ts本身还没有这么智能，所以需要手动指定类型
  container.context.matStore.phase.currentPhase = newPhase.phase_type;
};

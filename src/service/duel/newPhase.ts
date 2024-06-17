import { ygopro } from "@/api";
import { AudioActionType, playEffect } from "@/infra/audio";
import { matStore } from "@/stores";

export default (newPhase: ygopro.StocGameMessage.MsgNewPhase) => {
  playEffect(AudioActionType.SOUND_PHASE);
  // ts本身还没有这么智能，所以需要手动指定类型
  matStore.phase.currentPhase = newPhase.phase_type;
};

import { ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";
import { replayStore } from "@/stores";
import { displayPhaseBanner } from "@/ui/Duel/PlayMat/PhaseBanner";

export default async (
  container: Container,
  newPhase: ygopro.StocGameMessage.MsgNewPhase,
) => {
  if (container.conn.cancelled) return;
  playEffect(AudioActionType.SOUND_PHASE);
  // ts本身还没有这么智能，所以需要手动指定类型
  container.context.matStore.phase.currentPhase = newPhase.phase_type;
  // 横幅只控制展示节奏，是否等待玩家发动由 selectChain 单独决定。
  if (replayStore.isReplay || !container.conn.isClosed())
    await displayPhaseBanner(newPhase.phase_type);
};

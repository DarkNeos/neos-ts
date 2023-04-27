import { ygopro } from "@/api";
import { matStore, type PhaseName } from "@/stores";

export default (newPhase: ygopro.StocGameMessage.MsgNewPhase) => {
  // ts本身还没有这么智能，所以需要手动指定类型
  const currentPhase = ygopro.StocGameMessage.MsgNewPhase.PhaseType[
    newPhase.phase_type
  ] as PhaseName;
  matStore.phase.currentPhase = currentPhase;
};

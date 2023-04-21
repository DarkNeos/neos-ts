import { ygopro } from "@/api";
import { updatePhase } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import { matStore, type PhaseName } from "@/valtioStores";

export default (
  newPhase: ygopro.StocGameMessage.MsgNewPhase,
  dispatch: AppDispatch
) => {
  dispatch(
    updatePhase(
      ygopro.StocGameMessage.MsgNewPhase.PhaseType[newPhase.phase_type]
    )
  );

  // ts本身还没有这么智能，所以需要手动指定类型
  const currentPhase = ygopro.StocGameMessage.MsgNewPhase.PhaseType[
    newPhase.phase_type
  ] as PhaseName;

  matStore.phase.currentPhase = currentPhase;
};

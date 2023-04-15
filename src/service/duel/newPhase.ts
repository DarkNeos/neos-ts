import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { updatePhase } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";

export default (
  newPhase: ygopro.StocGameMessage.MsgNewPhase,
  dispatch: AppDispatch
) => {
  dispatch(
    updatePhase(
      ygopro.StocGameMessage.MsgNewPhase.PhaseType[newPhase.phase_type]
    )
  );
};

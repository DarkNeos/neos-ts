import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import { updatePhase } from "../../reducers/duel/mod";

export default (
  newPhase: ygopro.StocGameMessage.MsgNewPhase,
  dispatch: AppDispatch
) => {
  dispatch(updatePhase(newPhase.phase_type.toString()));
};

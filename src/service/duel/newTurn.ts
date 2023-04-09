import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { AppDispatch } from "@/store";
import { updateTurn } from "@/reducers/duel/mod";

export default (
  newTurn: ygopro.StocGameMessage.MsgNewTurn,
  dispatch: AppDispatch
) => {
  const player = newTurn.player;
  dispatch(updateTurn(player));
};

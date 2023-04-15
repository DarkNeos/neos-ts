import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { updateTurn } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";

export default (
  newTurn: ygopro.StocGameMessage.MsgNewTurn,
  dispatch: AppDispatch
) => {
  const player = newTurn.player;
  dispatch(updateTurn(player));
};

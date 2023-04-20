import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { updateTurn } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";

import { matStore } from "@/valtioStores";

export default (
  newTurn: ygopro.StocGameMessage.MsgNewTurn,
  dispatch: AppDispatch
) => {
  const player = newTurn.player;
  dispatch(updateTurn(player));
  matStore.currentPlayer = player;
};

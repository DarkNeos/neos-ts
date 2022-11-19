import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import { meInfoInit, opInfoInit } from "../../reducers/duel/mod";

export default (
  start: ygopro.StocGameMessage.MsgStart,
  dispatch: AppDispatch
) => {
  dispatch(
    meInfoInit({
      playerType: start.playerType.toString(),
      life: start.life1,
      deckSize: start.deckSize1,
      extraSize: start.extraSize1,
    })
  );

  dispatch(
    opInfoInit({
      life: start.life2,
      deckSize: start.deckSize2,
      extraSize: start.extraSize2,
    })
  );
};

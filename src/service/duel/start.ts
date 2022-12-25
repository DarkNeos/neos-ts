import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import { infoInit, setSelfType, initMonsters } from "../../reducers/duel/mod";

export default (
  start: ygopro.StocGameMessage.MsgStart,
  dispatch: AppDispatch
) => {
  dispatch(setSelfType(start.playerType));
  dispatch(
    infoInit([
      0,
      {
        life: start.life1,
        deckSize: start.deckSize1,
        extraSize: start.extraSize1,
      },
    ])
  );
  dispatch(
    infoInit([
      1,
      {
        life: start.life2,
        deckSize: start.deckSize2,
        extraSize: start.extraSize2,
      },
    ])
  );
  dispatch(initMonsters(0));
  dispatch(initMonsters(1));
};

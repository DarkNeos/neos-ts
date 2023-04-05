import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import {
  infoInit,
  setSelfType,
  initMonsters,
  initMagics,
  initCemetery,
  initDeck,
  initExclusion,
  initHint,
} from "../../reducers/duel/mod";

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
  dispatch(initMagics(0));
  dispatch(initMagics(1));
  dispatch(initCemetery(0));
  dispatch(initCemetery(1));
  dispatch(initDeck({ player: 0, deskSize: start.deckSize1 }));
  dispatch(initDeck({ player: 1, deskSize: start.deckSize2 }));
  dispatch(initExclusion(0));
  dispatch(initExclusion(1));
  dispatch(initHint(0));
  dispatch(initHint(1));
};

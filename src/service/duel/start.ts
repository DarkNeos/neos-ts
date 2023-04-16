import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import {
  infoInit,
  initBanishedZone,
  initDeck,
  initGraveyard,
  initHint,
  initMagics,
  initMonsters,
  setSelfType,
} from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";

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
  dispatch(initGraveyard(0));
  dispatch(initGraveyard(1));
  dispatch(initDeck({ player: 0, deskSize: start.deckSize1 }));
  dispatch(initDeck({ player: 1, deskSize: start.deckSize2 }));
  dispatch(initBanishedZone(0));
  dispatch(initBanishedZone(1));
  dispatch(initHint());
};

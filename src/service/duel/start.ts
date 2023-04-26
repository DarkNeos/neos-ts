import { ygopro } from "@/api";
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
import { valtioStore } from "@/valtioStores";

const { matStore } = valtioStore;

export default (
  start: ygopro.StocGameMessage.MsgStart,
  dispatch: AppDispatch
) => {
  // dispatch(setSelfType(start.playerType));

  matStore.selfType = start.playerType;

  matStore.initInfo.set(0, {
    life: start.life1,
    deckSize: start.deckSize1,
    extraSize: start.extraSize1,
  });
  matStore.initInfo.set(1, {
    life: start.life2,
    deckSize: start.deckSize2,
    extraSize: start.extraSize2,
  });

  // dispatch(
  //   infoInit([
  //     0,
  //     {
  //       life: start.life1,
  //       deckSize: start.deckSize1,
  //       extraSize: start.extraSize1,
  //     },
  //   ])
  // );
  // dispatch(
  //   infoInit([
  //     1,
  //     {
  //       life: start.life2,
  //       deckSize: start.deckSize2,
  //       extraSize: start.extraSize2,
  //     },
  //   ])
  // );

  // >>> 删除 >>>
  // dispatch(initMonsters(0));
  // dispatch(initMonsters(1));
  // dispatch(initMagics(0));
  // dispatch(initMagics(1));
  // dispatch(initGraveyard(0));
  // dispatch(initGraveyard(1));

  // dispatch(initDeck({ player: 0, deskSize: start.deckSize1 }));
  // dispatch(initDeck({ player: 1, deskSize: start.deckSize2 }));

  // dispatch(initBanishedZone(0));
  // dispatch(initBanishedZone(1));

  // <<< 删除 <<<
  // 上面的删除就可以了

  matStore.monsters.of(0).forEach((x) => (x.location.controler = 0));
  matStore.monsters.of(1).forEach((x) => (x.location.controler = 1));
  matStore.magics.of(0).forEach((x) => (x.location.controler = 0));
  matStore.magics.of(1).forEach((x) => (x.location.controler = 1));

  matStore.decks.of(0).add(Array(start.deckSize1).fill(0));
  matStore.decks.of(1).add(Array(start.deckSize2).fill(0));
  // dispatch(initHint()); // 直接删除
};

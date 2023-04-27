import { ygopro } from "@/api";
import { store } from "@/stores";

const { matStore } = store;

export default (start: ygopro.StocGameMessage.MsgStart) => {
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

  matStore.monsters.of(0).forEach((x) => (x.location.controler = 0));
  matStore.monsters.of(1).forEach((x) => (x.location.controler = 1));
  matStore.magics.of(0).forEach((x) => (x.location.controler = 0));
  matStore.magics.of(1).forEach((x) => (x.location.controler = 1));

  matStore.decks.of(0).add(Array(start.deckSize1).fill(0));
  matStore.decks.of(1).add(Array(start.deckSize2).fill(0));
};

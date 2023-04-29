import { v4 as v4uuid } from "uuid";

import { ygopro } from "@/api";
import { store } from "@/stores";

const { matStore } = store;

export default (start: ygopro.StocGameMessage.MsgStart) => {
  matStore.selfType = start.playerType;
  const opponent =
    start.playerType == ygopro.StocGameMessage.MsgStart.PlayerType.FirstStrike
      ? 1
      : 0;

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

  for (let i = 0; i < start.deckSize1; i++) {
    matStore.decks.me.push({
      uuid: v4uuid(),
      occupant: {
        id: 0,
        data: {},
        text: {},
      },
      location: {
        controler: 1 - opponent,
        zone: ygopro.CardZone.DECK,
      },
      counters: {},
      idleInteractivities: [],
    });
  }
  for (let i = 0; i < start.deckSize2; i++) {
    matStore.decks.op.push({
      uuid: v4uuid(),
      occupant: {
        id: 0,
        data: {},
        text: {},
      },
      location: {
        controler: opponent,
        zone: ygopro.CardZone.DECK,
      },
      counters: {},
      idleInteractivities: [],
    });
  }
  // 初始化对手的额外卡组
  for (let i = 0; i < start.extraSize2; i++) {
    matStore.extraDecks.op.push({
      uuid: v4uuid(),
      occupant: {
        id: 0,
        data: {},
        text: {},
      },
      location: {
        controler: opponent,
        zone: ygopro.CardZone.EXTRA,
      },
      counters: {},
      idleInteractivities: [],
    });
  }
};

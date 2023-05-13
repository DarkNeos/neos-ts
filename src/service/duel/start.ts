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
      focus: false,
      chaining: false,
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
      focus: false,
      chaining: false,
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
      focus: false,
      chaining: false,
      counters: {},
      idleInteractivities: [],
    });
  }

  // 在`WaitRoom`页面会设置自己的额外卡组，但那时候拿不到正确的`controller`值，因为不知道自己是先攻还是后手，因此这里需要重新为自己的额外卡组设置`controller`值
  matStore
    .in(ygopro.CardZone.EXTRA)
    .me.forEach((state) => (state.location.controler = 1 - opponent));
};

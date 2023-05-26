import { v4 as v4uuid } from "uuid";

import { fetchCard, ygopro } from "@/api";
import { playerStore, store, cardStore, CardType } from "@/stores";

import { flatten } from "lodash-es";
import { proxy } from "valtio";
import { subscribeKey } from "valtio/utils";
const { matStore } = store;

export default (start: ygopro.StocGameMessage.MsgStart) => {
  matStore.selfType = start.playerType;
  const opponent =
    start.playerType == ygopro.StocGameMessage.MsgStart.PlayerType.FirstStrike
      ? 1
      : 0;

  const meName = playerStore.getMePlayer().name;
  const opName = playerStore.getOpPlayer().name;

  matStore.initInfo.set(0, {
    life: start.life1,
    name: opponent == 0 ? opName : meName,
    deckSize: start.deckSize1,
    extraSize: start.extraSize1,
  });
  matStore.initInfo.set(1, {
    life: start.life2,
    name: opponent == 1 ? opName : meName,
    deckSize: start.deckSize2,
    extraSize: start.extraSize2,
  });

  matStore.monsters.of(0).forEach((x) => (x.location.controler = 0));
  matStore.monsters.of(1).forEach((x) => (x.location.controler = 1));
  matStore.magics.of(0).forEach((x) => (x.location.controler = 0));
  matStore.magics.of(1).forEach((x) => (x.location.controler = 1));

  for (let i = 0; i < start.deckSize1; i++) {
    matStore.decks.of(0).push({
      uuid: v4uuid(),
      occupant: {
        id: 0,
        data: {},
        text: {},
      },
      location: {
        controler: 0,
        zone: ygopro.CardZone.DECK,
      },
      focus: false,
      chaining: false,
      directAttack: false,
      counters: {},
      idleInteractivities: [],
    });
  }
  for (let i = 0; i < start.deckSize2; i++) {
    matStore.decks.of(1).push({
      uuid: v4uuid(),
      occupant: {
        id: 0,
        data: {},
        text: {},
      },
      location: {
        controler: 1,
        zone: ygopro.CardZone.DECK,
      },
      focus: false,
      chaining: false,
      directAttack: false,
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
      directAttack: false,
      counters: {},
      idleInteractivities: [],
    });
  }

  // 在`WaitRoom`页面会设置自己的额外卡组，但那时候拿不到正确的`controller`值，因为不知道自己是先攻还是后手，因此这里需要重新为自己的额外卡组设置`controller`值
  matStore
    .in(ygopro.CardZone.EXTRA)
    .me.forEach((state) => (state.location.controler = 1 - opponent));

  // 下面是cardStore的初始化

  /** 自动从code推断出occupant */
  const genCard = (o: CardType) => {
    const t = proxy(o);
    subscribeKey(t, "code", async (code) => {
      const { text, data } = await fetchCard(code ?? 0);
      t.text = text;
      t.data = data;
    });
    return t;
  };

  const TOKEN_SIZE = 13; // 每人场上最多就只可能有13个token
  let uuid = 0;
  const cards = flatten(
    [
      start.deckSize1,
      start.extraSize1,
      TOKEN_SIZE,
      start.deckSize2,
      start.extraSize2,
      TOKEN_SIZE,
    ].map((length, i) =>
      Array.from({ length }).map((_, sequence) =>
        genCard({
          uuid: uuid++,
          code: 0,
          controller: i < 3 ? 1 - opponent : opponent, // 前3个是自己的卡组，后3个是对手的卡组
          originController: i < 3 ? 1 - opponent : opponent,
          zone: [
            ygopro.CardZone.DECK,
            ygopro.CardZone.EXTRA,
            ygopro.CardZone.TZONE,
          ][i % 3],
          counters: {},
          idleInteractivities: [],
          sequence,
          data: {},
          text: {},
          isToken: !((i + 1) % 3),
          overlayMaterials: [],
          position: ygopro.CardPosition.FACEDOWN,
        })
      )
    )
  );

  cardStore.inner.push(...cards);
  // 设置自己的额外卡组，信息是在waitroom之中拿到的
  cardStore
    .at(ygopro.CardZone.EXTRA, 1 - opponent)
    .forEach((card) => (card.code = myExtraDeckCodes.shift()!));
};

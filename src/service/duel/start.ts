import { flatten } from "lodash-es";
import { v4 as v4uuid } from "uuid";
import { proxy } from "valtio";
import { subscribeKey } from "valtio/utils";

import { fetchCard, ygopro } from "@/api";
import { cardStore, CardType, playerStore, store } from "@/stores";
const { matStore } = store;
const TOKEN_SIZE = 13; // 每人场上最多就只可能有13个token

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

  // 下面是cardStore的初始化

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
          uuid: v4uuid(),
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
          focus: false,
          chaining: false,
          directAttack: false,
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

// 自动从code推断出occupant
const genCard = (o: CardType) => {
  const t = proxy(o);
  subscribeKey(t, "code", async (code) => {
    const { text, data } = await fetchCard(code ?? 0);
    t.text = text;
    t.data = data;
  });
  return t;
};

import { flatten } from "lodash-es";
import { v4 as v4uuid } from "uuid";
import { proxy } from "valtio";
import { subscribeKey } from "valtio/utils";

import { fetchCard, ygopro } from "@/api";
import { useConfig } from "@/config";
import { sleep } from "@/infra";
import { cardStore, CardType, matStore } from "@/stores";

const TOKEN_SIZE = 13; // 每人场上最多就只可能有13个token

export default async (start: ygopro.StocGameMessage.MsgStart) => {
  // 先初始化`matStore`
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

  // 再初始化`cardStore`

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
          location: new ygopro.CardLocation({
            controller: i < 3 ? 0 : 1,
            zone: [
              ygopro.CardZone.DECK,
              ygopro.CardZone.EXTRA,
              ygopro.CardZone.TZONE,
            ][i % 3],
            sequence,
            position: ygopro.CardPosition.FACEDOWN,
          }),
          originController: i < 3 ? 0 : 1,
          counters: {},
          idleInteractivities: [],
          meta: {
            id: 0,
            data: {},
            text: {},
          },
          isToken: !((i + 1) % 3),
        })
      )
    )
  );

  cardStore.inner.push(...cards);
  // 设置自己的额外卡组，信息是在waitroom之中拿到的
  cardStore
    .at(ygopro.CardZone.EXTRA, 1 - opponent)
    .forEach((card) => (card.code = myExtraDeckCodes.pop()!));

  // 初始化完后，sleep 1s，让UI初始化完成，
  // 否则在和AI对战时，由于后端给传给前端的`MSG`频率太高，会导致一些问题。
  await sleep(useConfig().startDelay);
};

// 自动从code推断出occupant
const genCard = (o: CardType) => {
  const t = proxy(o);
  subscribeKey(t, "code", async (code) => {
    const meta = await fetchCard(code ?? 0);
    t.meta = meta;
  });
  return t;
};

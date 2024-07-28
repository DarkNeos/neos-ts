import { flatten } from "lodash-es";
import { v4 as v4uuid } from "uuid";

import { ygopro } from "@/api";
import { useConfig } from "@/config";
import { Container } from "@/container";
import { sleep } from "@/infra";
import { replayStore, RoomStage, SideStage } from "@/stores";
import { replayStart } from "@/ui/Match/ReplayModal";

import { genCard } from "../utils";
const TOKEN_SIZE = 13; // 每人场上最多就只可能有13个token

export default async (
  container: Container,
  start: ygopro.StocGameMessage.MsgStart,
) => {
  const context = container.context;
  // 先初始化`matStore`
  context.matStore.selfType = start.playerType;

  if (context.sideStore.stage !== SideStage.NONE) {
    // 更新Side状态
    context.sideStore.stage = SideStage.DUEL_START;
  } else {
    // 通知房间页面决斗开始
    // 这行在该函数中的位置不能随便放，否则可能会block住
    context.roomStore.stage = RoomStage.DUEL_START;
  }

  context.matStore.initInfo.set(0, {
    life: start.life1,
    deckSize: start.deckSize1,
    extraSize: start.extraSize1,
  });
  context.matStore.initInfo.set(1, {
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
          counters: {},
          idleInteractivities: [],
          meta: {
            id: 0,
            data: {},
            text: {},
          },
          isToken: !((i + 1) % 3),
          targeted: false,
          selectInfo: {
            selectable: false,
            selected: false,
          },
          status: 0,
        }),
      ),
    ),
  );

  context.cardStore.inner.push(...cards);

  // note: 额外卡组的卡会在对局开始后通过`UpdateData` msg更新

  if (replayStore.isReplay) {
    replayStart();
  }

  // 初始化完后，sleep 1s，让UI初始化完成，
  // 否则在和AI对战时，由于后端给传给前端的`MSG`频率太高，会导致一些问题。
  await sleep(useConfig().startDelay);
};

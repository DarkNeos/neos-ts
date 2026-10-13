import { flatten } from "lodash-es";
import { v4 as v4uuid } from "uuid";

import { ygopro } from "@/api";
import { useConfig } from "@/config";
import { Container } from "@/container";
import { sleep } from "@/infra";
import { replayStore, resetDuel, RoomStage, SideStage } from "@/stores";
import { settingStore } from "@/stores/settingStore";

import { genCard } from "../utils";
const TOKEN_SIZE = 13; // 每人场上最多就只可能有13个token

export default async (
  container: Container,
  start: ygopro.StocGameMessage.MsgStart,
) => {
  const context = container.context;
  // 下一局开局时才清理上一局，结算后等待服务器期间保留最终场地。
  if (context.cardStore.inner.length) resetDuel();
  if (replayStore.isReplay) {
    replayStore.game += 1;
  }
  context.matStore.chainSetting = settingStore.duel.initialChain;
  // MSG_START 是最终先后攻结果；与请求不符时终止训练，避免误以为设置生效。
  const training = context.trainingStore.session;
  if (training) {
    const expected = training.first
      ? ygopro.StocGameMessage.MsgStart.PlayerType.FirstStrike
      : ygopro.StocGameMessage.MsgStart.PlayerType.SecondStrike;
    if (start.playerType !== expected) {
      const error =
        "服务器没有按训练设置选择先后攻，训练已停止，请更换服务器后重试";
      context.trainingStore.error = error;
      context.roomStore.errorMsg = error;
      throw new Error(error);
    }
  }
  context.matStore.deckReserved = false;
  context.matStore.chainCards = [];
  context.matStore.chains = [];
  context.matStore.playerHints = {};
  context.matStore.hint.zones = [];
  // 先初始化`matStore`
  context.matStore.selfType =
    replayStore.isReplay && replayStore.swapped
      ? start.playerType ===
        ygopro.StocGameMessage.MsgStart.PlayerType.SecondStrike
        ? ygopro.StocGameMessage.MsgStart.PlayerType.FirstStrike
        : ygopro.StocGameMessage.MsgStart.PlayerType.SecondStrike
      : start.playerType;
  if (replayStore.isReplay) {
    const decks = replayStore.decks.filter(
      (deck) => deck.game === replayStore.game,
    );
    context.roomStore.players = [0, 1].map((player) => ({
      name: decks[player]?.player ?? `玩家 ${player + 1}`,
      isMe: context.matStore.isMe(player),
      state: ygopro.StocHsPlayerChange.State.READY,
    }));
  }

  if (context.sideStore.stage !== SideStage.NONE) {
    // 更新Side状态
    context.sideStore.stage = SideStage.DUEL_START;
  } else {
    // 临时添加，防止上局在`EndModal`里面通过判断`conn.isClosed`返回
    // Match页了，但是`handleDuelEnd`继续执行，这时候`matStore.duelEnd`是true
    //
    // 长期修改方案应该是将store通过容器管理起来，每一场对局都是单独的容器实例，
    // 这样对局之间就不会互相影响。
    context.matStore.duelEnd = false;

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
            position:
              i % 3 === 2
                ? ygopro.CardPosition.FACEDOWN
                : ygopro.CardPosition.FACEDOWN_DEFENSE,
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

  if (replayStore.isReplay && !replayStore.seeking) {
    replayStore.playbackReady = true;
  }

  // 初始化完后，sleep 1s，让UI初始化完成，
  // 否则在和AI对战时，由于后端给传给前端的`MSG`频率太高，会导致一些问题。
  if (!replayStore.seeking) await sleep(useConfig().startDelay);
};

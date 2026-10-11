/*
 * 长连接消息事件订阅处理逻辑
 *
 * */
import { adaptStoc } from "@/api/ocgcore/ocgAdapter/adapter";
import { YgoProPacket } from "@/api/ocgcore/ocgAdapter/packet";
import { STOC_REPLAY } from "@/api/ocgcore/ocgAdapter/protoDecl";
import { Container } from "@/container";
import { replayStore } from "@/stores";
import { replayPlayback } from "@/stores/replayStore";

import handleGameMsg from "./duel/gameMsg";
import handleTimeLimit from "./duel/timeLimit";
import handleDeckCount from "./mora/deckCount";
import handleSelectHand from "./mora/selectHand";
import handleSelectTp from "./mora/selectTp";
import handleChat from "./room/chat";
import handleDuelEnd from "./room/duelEnd";
import handleDuelStart from "./room/duelStart";
import handleErrorMsg from "./room/errorMsg";
import handleHandResult from "./room/handResult";
import handleHsPlayerChange from "./room/hsPlayerChange";
import handleHsPlayerEnter from "./room/hsPlayerEnter";
import handleHsWatchChange from "./room/hsWatchChange";
import handleJoinGame from "./room/joinGame";
import handleTypeChange from "./room/typeChange";
import { handleChangeSide } from "./side/changeSide";
import { handleWaitingSide } from "./side/waitingSide";

/*
 * 先将从长连接中读取到的二进制数据通过Adapter转成protobuf结构体，
 * 然后再分发到各个处理函数中去处理。
 *
 * */

// 每个容器维护自己的顺序队列，新连接不会等待旧对局尚未完成的弹窗或动画。
const queues = new WeakMap<Container, Promise<void>>();

export default async function handleSocketMessage(
  container: Container,
  e: MessageEvent,
) {
  // 动画和选卡处理需要等待完成，后续协议消息才能读取对应的最新状态。
  const next = (queues.get(container) ?? Promise.resolve()).then(() =>
    _handle(container, e),
  );
  queues.set(container, next);
  await next;
}

// FIXME: 下面的所有`handler`中访问`Store`的时候都应该通过`Container`进行访问
async function _handle(container: Container, e: MessageEvent) {
  if (container.conn.cancelled) return;
  const packets = YgoProPacket.deserialize(e.data);

  for (const packet of packets) {
    if (container.conn.cancelled) return;
    // 原始录像已在接收时保存，不经过演出队列。
    if (packet.proto === STOC_REPLAY) continue;
    const pb = adaptStoc(packet);
    const dispatch = () => handlePacket(container, packet, pb);
    if (replayStore.isReplay && pb.msg === "stoc_game_msg") {
      const advanced = await replayPlayback.handleMessage(
        pb.stoc_game_msg.gameMsg,
        dispatch,
        () => container.conn.cancelled,
      );
      if (!advanced) return;
    } else {
      await dispatch();
    }
  }
}

async function handlePacket(
  container: Container,
  packet: YgoProPacket,
  pb: ReturnType<typeof adaptStoc>,
) {
  switch (pb.msg) {
    case "stoc_join_game": {
      handleJoinGame(container, pb);
      break;
    }
    case "stoc_chat": {
      handleChat(container, pb);
      break;
    }
    case "stoc_hs_player_change": {
      handleHsPlayerChange(container, pb);
      break;
    }
    case "stoc_hs_watch_change": {
      handleHsWatchChange(container, pb);
      break;
    }
    case "stoc_hs_player_enter": {
      handleHsPlayerEnter(container, pb);
      break;
    }
    case "stoc_type_change": {
      handleTypeChange(container, pb);
      break;
    }
    case "stoc_select_hand": {
      handleSelectHand(container, pb);
      break;
    }
    case "stoc_hand_result": {
      handleHandResult(container, pb);
      break;
    }
    case "stoc_select_tp": {
      handleSelectTp(container, pb);
      break;
    }
    case "stoc_deck_count": {
      handleDeckCount(container, pb);
      break;
    }
    case "stoc_duel_start": {
      handleDuelStart(container, pb);
      break;
    }
    case "stoc_duel_end": {
      handleDuelEnd(container, pb);
      break;
    }
    case "stoc_game_msg": {
      await handleGameMsg(container, pb);

      break;
    }
    case "stoc_time_limit": {
      handleTimeLimit(container, pb.stoc_time_limit);
      break;
    }
    case "stoc_error_msg": {
      await handleErrorMsg(container, pb.stoc_error_msg);
      break;
    }
    case "stoc_change_side": {
      handleChangeSide(container, pb.stoc_change_side);
      break;
    }
    case "stoc_waiting_side": {
      handleWaitingSide(container, pb.stoc_waiting_side);
      break;
    }
    default: {
      console.log(packet);

      break;
    }
  }
}

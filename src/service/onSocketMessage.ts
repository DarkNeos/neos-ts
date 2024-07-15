/*
 * 长连接消息事件订阅处理逻辑
 *
 * */
import { adaptStoc } from "@/api/ocgcore/ocgAdapter/adapter";
import { YgoProPacket } from "@/api/ocgcore/ocgAdapter/packet";
import { Container } from "@/container";
import { replayStore } from "@/stores";

import { YgoAgent } from "./duel/agent";
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

let animation: Promise<void> = Promise.resolve();

export default async function handleSocketMessage(
  container: Container,
  e: MessageEvent,
  agent?: YgoAgent,
) {
  // 确保按序执行
  animation = animation.then(() => _handle(container, e, agent));
}

// FIXME: 下面的所有`handler`中访问`Store`的时候都应该通过`Container`进行访问
async function _handle(
  container: Container,
  e: MessageEvent,
  agent?: YgoAgent,
) {
  const packets = YgoProPacket.deserialize(e.data);

  for (const packet of packets) {
    const pb = adaptStoc(packet);

    switch (pb.msg) {
      case "stoc_join_game": {
        handleJoinGame(pb);
        break;
      }
      case "stoc_chat": {
        handleChat(pb);
        break;
      }
      case "stoc_hs_player_change": {
        handleHsPlayerChange(pb);
        break;
      }
      case "stoc_hs_watch_change": {
        handleHsWatchChange(pb);
        break;
      }
      case "stoc_hs_player_enter": {
        handleHsPlayerEnter(pb);
        break;
      }
      case "stoc_type_change": {
        handleTypeChange(pb);
        break;
      }
      case "stoc_select_hand": {
        handleSelectHand(pb);
        break;
      }
      case "stoc_hand_result": {
        handleHandResult(pb);
        break;
      }
      case "stoc_select_tp": {
        handleSelectTp(pb);
        break;
      }
      case "stoc_deck_count": {
        handleDeckCount(pb);
        break;
      }
      case "stoc_duel_start": {
        handleDuelStart(pb);
        break;
      }
      case "stoc_duel_end": {
        handleDuelEnd(pb);
        break;
      }
      case "stoc_game_msg": {
        if (!replayStore.isReplay) {
          // 如果不是回放模式，则记录回放数据
          replayStore.record(packet);
        }
        await handleGameMsg(container, pb, agent);

        break;
      }
      case "stoc_time_limit": {
        handleTimeLimit(container, pb.stoc_time_limit);
        break;
      }
      case "stoc_error_msg": {
        await handleErrorMsg(pb.stoc_error_msg);
        break;
      }
      case "stoc_change_side": {
        handleChangeSide(pb.stoc_change_side);
        break;
      }
      case "stoc_waiting_side": {
        handleWaitingSide(pb.stoc_waiting_side);
        break;
      }
      default: {
        console.log(packet);

        break;
      }
    }
  }
}

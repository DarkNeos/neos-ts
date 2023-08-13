/*
 * 长连接消息事件订阅处理逻辑
 *
 * */
import { adaptStoc } from "@/api/ocgcore/ocgAdapter/adapter";
import { YgoProPacket } from "@/api/ocgcore/ocgAdapter/packet";
import { matStore, replayStore } from "@/stores";

import handleGameMsg from "./duel/gameMsg";
import handleTimeLimit from "./duel/timeLimit";
import handleDeckCount from "./mora/deckCount";
import handleSelectHand from "./mora/selectHand";
import handleSelectTp from "./mora/selectTp";
import handleChat from "./room/chat";
import handleDuelStart from "./room/duelStart";
import handleHandResult from "./room/handResult";
import handleHsPlayerChange from "./room/hsPlayerChange";
import handleHsPlayerEnter from "./room/hsPlayerEnter";
import handleHsWatchChange from "./room/hsWatchChange";
import handleJoinGame from "./room/joinGame";
import handleTypeChange from "./room/typeChange";

/*
 * 先将从长连接中读取到的二进制数据通过Adapter转成protobuf结构体，
 * 然后再分发到各个处理函数中去处理。
 *
 * */
export default async function handleSocketMessage(e: MessageEvent) {
  const packet = YgoProPacket.deserialize(e.data);
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
    case "stoc_game_msg": {
      await handleGameMsg(pb);

      if (!matStore.isReplay) {
        // 如果不是回放模式，则记录回放数据
        replayStore.record(packet);
      }

      break;
    }
    case "stoc_time_limit": {
      handleTimeLimit(pb.stoc_time_limit);

      break;
    }
    default: {
      console.log(packet);

      break;
    }
  }
}

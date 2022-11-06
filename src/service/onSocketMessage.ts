/*
 * 长连接消息事件订阅处理逻辑
 *
 * */
import handleHsPlayerChange from "./room/hsPlayerChange";
import handleTypeChange from "./room/typeChange";
import handleHsPlayerEnter from "./room/hsPlayerEnter";
import handleJoinGame from "./room/joinGame";
import handleChat from "./room/chat";
import handleHsWatchChange from "./room/hsWatchChange";
import { YgoProPacket } from "../api/ocgcore/ocgAdapter/packet";
import { adaptStoc } from "../api/ocgcore/ocgAdapter/adapter";
import handleSelectHand from "./mora/selectHand";
import handleSelectTp from "./mora/selectTp";
import handleDeckCount from "./mora/deckCount";

/*
 * 先将从长连接中读取到的二进制数据通过Adapter转成protobuf结构体，
 * 然后再分发到各个处理函数中去处理。
 *
 * */
export default function handleSocketMessage(e: MessageEvent) {
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
      // TODO
      console.log("TODO: handle STOC HandResult.");

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
      // TODO
      console.log("TODO: handle STOC DuleStart.");

      break;
    }
    default: {
      console.log(packet);

      break;
    }
  }
}

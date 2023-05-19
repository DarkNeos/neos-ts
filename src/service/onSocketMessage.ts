/*
 * 长连接消息事件订阅处理逻辑
 *
 * */
import { ygopro } from "@/api";
import { adaptStoc } from "@/api/ocgcore/ocgAdapter/adapter";
import { YgoProPacket } from "@/api/ocgcore/ocgAdapter/packet";
import { useConfig } from "@/config";
import { matStore } from "@/stores";

import handleGameMsg from "./duel/gameMsg";
import handleTimeLimit from "./duel/timeLimit";
import handleDeckCount from "./mora/deckCount";
import handleSelectHand from "./mora/selectHand";
import handleSelectTp from "./mora/selectTp";
import handleChat from "./room/chat";
import handleDuelStart from "./room/duelStart";
import handleHsPlayerChange from "./room/hsPlayerChange";
import handleHsPlayerEnter from "./room/hsPlayerEnter";
import handleHsWatchChange from "./room/hsWatchChange";
import handleJoinGame from "./room/joinGame";
import handleTypeChange from "./room/typeChange";

const NeosConfig = useConfig();

/*
 * 先将从长连接中读取到的二进制数据通过Adapter转成protobuf结构体，
 * 然后再分发到各个处理函数中去处理。
 *
 * */
export default async function handleSocketMessage(e: MessageEvent) {
  const packet = YgoProPacket.deserialize(e.data);
  const pb = adaptStoc(packet);
  const delay = handleDelay(pb);

  setTimeout(() => {
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
        handleDuelStart(pb);

        break;
      }
      case "stoc_game_msg": {
        handleGameMsg(pb);

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
  }, delay);
}

// 该函数用于控频，防止MSG更新太频繁，返回值是延迟的时间戳（毫秒）
//
// 对于一般的MSG，我们会延迟200ms执行处理逻辑；
// 当处理一些带有动画效果的MSG时，比如`MSG_MOVE`，`MSG_CHAINING`，我们会设置下一次执行处理逻辑的延迟，确保动画完整
function handleDelay(stoc: ygopro.YgoStocMsg): number {
  const delay = matStore.delay;

  // 重置下次`delay`
  matStore.delay = NeosConfig.ui.commonDelay;

  // 对特定的`MSG`，设置特化的`delay`
  if (stoc.has_stoc_game_msg) {
    if (stoc.stoc_game_msg.gameMsg == "move") {
      matStore.delay = NeosConfig.ui.moveDelay + 500;
    } else if (stoc.stoc_game_msg.gameMsg == "chaining") {
      matStore.delay = NeosConfig.ui.chainingDelay;
    } else if (stoc.stoc_game_msg.gameMsg == "attack") {
      matStore.delay = NeosConfig.ui.attackDelay + 200;
    }
  }

  return delay;
}

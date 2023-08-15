import { ygopro } from "../idl/ocgcore";
import { YgoProPacket } from "./packet";
import {
  STOC_CHAT,
  STOC_DECK_COUNT,
  STOC_DUEL_START,
  STOC_ERROR_MSG,
  STOC_GAME_MSG,
  STOC_HAND_RESULT,
  STOC_HS_PLAYER_CHANGE,
  STOC_HS_PLAYER_ENTER,
  STOC_HS_WATCH_CHANGE,
  STOC_JOIN_GAME,
  STOC_SELECT_HAND,
  STOC_SELECT_TP,
  STOC_TIME_LIMIT,
  STOC_TYPE_CHANGE,
} from "./protoDecl";
import StocChat from "./stoc/stocChat";
import StocDeckCount from "./stoc/stocDeckCount";
import StocDuelStart from "./stoc/stocDuelStart";
import StocErrorMsg from "./stoc/stocErrorMsg";
import StocGameMsg from "./stoc/stocGameMsg/mod";
import StocHandResult from "./stoc/stocHandResult";
import StocHsPlayerChange from "./stoc/stocHsPlayerChange";
import StocHsPlayerEnter from "./stoc/stocHsPlayerEnter";
import StocHsWatchChange from "./stoc/stocHsWatchChange";
import StocJoinGame from "./stoc/stocJoinGame";
import StocSelectHand from "./stoc/stocSelectHand";
import StocSelectTp from "./stoc/stocSelectTp";
import StocTimeLimit from "./stoc/stocTimeLimit";
import StocTypeChange from "./stoc/stocTypeChange";

/*
 * 将[`ygoProPacket`]对象转换成[`ygopro.YgoStocMsg`]对象
 *
 * @param packet - The ygoProPacket object
 * @returns The ygopro.YgoStocMsg object
 *
 * */
export function adaptStoc(packet: YgoProPacket): ygopro.YgoStocMsg {
  let pb = new ygopro.YgoStocMsg({});
  switch (packet.proto) {
    case STOC_JOIN_GAME: {
      pb = new StocJoinGame(packet).upcast();
      break;
    }
    case STOC_CHAT: {
      pb = new StocChat(packet).upcast();
      break;
    }
    case STOC_HS_PLAYER_ENTER: {
      pb = new StocHsPlayerEnter(packet).upcast();
      break;
    }
    case STOC_HS_PLAYER_CHANGE: {
      pb = new StocHsPlayerChange(packet).upcast();
      break;
    }
    case STOC_HS_WATCH_CHANGE: {
      pb = new StocHsWatchChange(packet).upcast();
      break;
    }
    case STOC_TYPE_CHANGE: {
      pb = new StocTypeChange(packet).upcast();
      break;
    }
    case STOC_SELECT_HAND: {
      pb = new StocSelectHand(packet).upcast();
      break;
    }
    case STOC_SELECT_TP: {
      pb = new StocSelectTp(packet).upcast();
      break;
    }
    case STOC_HAND_RESULT: {
      pb = new StocHandResult(packet).upcast();
      break;
    }
    case STOC_DECK_COUNT: {
      pb = new StocDeckCount(packet).upcast();
      break;
    }
    case STOC_DUEL_START: {
      pb = new StocDuelStart(packet).upcast();
      break;
    }
    case STOC_GAME_MSG: {
      pb = new StocGameMsg(packet).upcast();
      break;
    }
    case STOC_TIME_LIMIT: {
      pb = new StocTimeLimit(packet).upcast();
      break;
    }
    case STOC_ERROR_MSG: {
      pb = new StocErrorMsg(packet).upcast();
      break;
    }
    default: {
      break;
    }
  }

  return pb;
}

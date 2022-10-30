import { ygoProPacket } from "./packet";
import { ygopro } from "../idl/ocgcore";
import {
  STOC_CHAT,
  STOC_HS_PLAYER_CHANGE,
  STOC_HS_PLAYER_ENTER,
  STOC_HS_WATCH_CHANGE,
  STOC_JOIN_GAME,
  STOC_TYPE_CHANGE,
  STOC_SELECT_HAND,
} from "./protoDecl";
import StocChat from "./stoc/stocChat";
import StocJoinGame from "./stoc/stocJoinGame";
import StocHsPlayerEnter from "./stoc/stocHsPlayerEnter";
import StocHsPlayerChange from "./stoc/stocHsPlayerChange";
import StocHsWatchChange from "./stoc/stocHsWatchChange";
import StocTypeChange from "./stoc/stocTypeChange";
import StocSelectHand from "./stoc/stocSelectHand";

/*
 * 将[`ygoProPacket`]对象转换成[`ygopro.YgoStocMsg`]对象
 *
 * @param packet - The ygoProPacket object
 * @returns The ygopro.YgoStocMsg object
 *
 * */
export function adaptStoc(packet: ygoProPacket): ygopro.YgoStocMsg {
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
    default: {
      break;
    }
  }

  return pb;
}

import { ygopro } from "../api/ocgcore/idl/ocgcore";
import handleHsPlayerChange from "./room/hsPlayerChange";
import handleTypeChange from "./room/typeChange";
import handleHsPlayerEnter from "./room/hsPlayerEnter";
import handleJoinGame from "./room/joinGame";
import handleChat from "./room/chat";
import handleHsWatchChange from "./room/hsWatchChange";
import { ygoArrayBuilder } from "../api/ocgcore/ocgAdapter/packet";
import StocJoinGame from "../api/ocgcore/ocgAdapter/stoc/stocJoinGame";
import {
  STOC_CHAT,
  STOC_HS_PLAYER_ENTER,
  STOC_JOIN_GAME,
} from "../api/ocgcore/ocgAdapter/protoDecl";
import StocChat from "../api/ocgcore/ocgAdapter/stoc/stocChat";
import StocHsPlayerEnter from "../api/ocgcore/ocgAdapter/stoc/stocHsPlayerEnter";

export default function handleSocketMessage(e: MessageEvent) {
  const packet = new ygoArrayBuilder(e.data);
  console.log(packet);
  let pb = new ygopro.YgoStocMsg({});

  switch (packet.proto) {
    case STOC_JOIN_GAME: {
      pb = new StocJoinGame(packet).adapt();

      break;
    }
    case STOC_CHAT: {
      pb = new StocChat(packet).adapt();

      break;
    }
    case STOC_HS_PLAYER_ENTER: {
      pb = new StocHsPlayerEnter(packet).adapt();

      break;
    }
    default: {
      break;
    }
  }

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
    default: {
      break;
    }
  }
}

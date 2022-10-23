import { ygopro } from "../api/ocgcore/idl/ocgcore";
import handleHsPlayerChange from "./room/hsPlayerChange";
import handleTypeChange from "./room/typeChange";
import handleHsPlayerEnter from "./room/hsPlayerEnter";
import handleJoinGame from "./room/joinGame";
import handleChat from "./room/chat";
import handleHsWatchChange from "./room/hsWatchChange";
import { ygoArrayBuilder } from "../api/ocgcore/ocgAdapter/packet";
import StocJoinGame from "../api/ocgcore/ocgAdapter/stocJoinGame";
import { STOC_JOIN_GAME } from "../api/ocgcore/ocgAdapter/protoDecl";

export default function handleSocketMessage(e: MessageEvent) {
  const packet = new ygoArrayBuilder(e.data);
  let pb = new ygopro.YgoStocMsg({});

  switch (packet.proto) {
    case STOC_JOIN_GAME: {
      pb = new StocJoinGame(packet).adapt();

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

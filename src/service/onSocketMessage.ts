import handleHsPlayerChange from "./room/hsPlayerChange";
import handleTypeChange from "./room/typeChange";
import handleHsPlayerEnter from "./room/hsPlayerEnter";
import handleJoinGame from "./room/joinGame";
import handleChat from "./room/chat";
import handleHsWatchChange from "./room/hsWatchChange";
import { ygoProPacket } from "../api/ocgcore/ocgAdapter/packet";
import { adaptStoc } from "../api/ocgcore/ocgAdapter/adapter";

export default function handleSocketMessage(e: MessageEvent) {
  const packet = ygoProPacket.deserialize(e.data);
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
    default: {
      break;
    }
  }
}

import { ygopro } from "../../api/ocgcore/idl/ocgcore";

export default function handleGameMsg(pb: ygopro.YgoStocMsg) {
  const msg = pb.stoc_game_msg;

  switch (msg.gameMsg) {
    case "start": {
      // TODO
      console.log(msg.start);

      break;
    }
    default: {
      console.log("Unhandled GameMsg=" + msg.gameMsg);

      break;
    }
  }
}

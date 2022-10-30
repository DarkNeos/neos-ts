import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket } from "../packet";
import { CTOS_HAND_RESULT } from "../protoDecl";

/*
 * CTOS HandResult
 *
 * @param res: unsigned char - 玩家的猜拳选择
 *
 * @usage - 告知服务端当前玩家的猜拳选择
 * */
export default class CtosHandResultPacket extends ygoProPacket {
  constructor(pb: ygopro.YgoCtosMsg) {
    const handResult = pb.ctos_hand_result;

    const hand = handResult.hand;
    const exData = new Uint8Array(1);
    const dataView = new DataView(exData.buffer);

    switch (hand) {
      case ygopro.HandType.SCISSORS: {
        dataView.setUint8(0, 1);

        break;
      }
      case ygopro.HandType.ROCK: {
        dataView.setUint8(0, 2);

        break;
      }
      case ygopro.HandType.PAPER: {
        dataView.setUint8(0, 3);

        break;
      }
      default: {
        console.log("Unknown HandResult type" + hand);
      }
    }

    super(exData.length + 1, CTOS_HAND_RESULT, exData);
  }
}

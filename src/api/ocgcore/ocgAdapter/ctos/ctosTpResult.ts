import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket } from "../packet";
import { CTOS_TP_RESULT } from "../protoDecl";

/*
 * CTOS CTOS_TP_RESULT
 *
 * @param res: unsigned char - 玩家的先后攻选择
 *
 * @usage - 告知服务端当前玩家的先后攻选择
 *
 * */
export default class CtosTpResultPacket extends ygoProPacket {
  constructor(pb: ygopro.YgoCtosMsg) {
    const tpResult = pb.ctos_tp_result;

    const tp = tpResult.tp;
    const exData = new Uint8Array(1);
    const dataView = new DataView(exData.buffer);

    switch (tp) {
      case ygopro.CtosTpResult.TpType.FIRST: {
        dataView.setUint8(0, 1);

        break;
      }
      case ygopro.CtosTpResult.TpType.SECOND: {
        dataView.setUint8(0, 0);

        break;
      }
      default: {
        console.log("Unknown HandResult type" + tp);
      }
    }

    super(exData.length + 1, CTOS_TP_RESULT, exData);
  }
}

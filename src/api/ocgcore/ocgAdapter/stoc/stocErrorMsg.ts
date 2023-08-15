import { BufferReader } from "rust-src";

import { ygopro } from "../../idl/ocgcore";
import { StocAdapter, YgoProPacket } from "../packet";

/*
 * STOC Error Msg
 *
 * @usage - 后端传来的错误信息
 * */

export default class ErrorMsg implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    const reader = new BufferReader(this.packet.exData);

    const errorType = reader.readUint8();
    let errorCode = 0;
    if (errorType != 3) {
      reader.readUint8();
      reader.readUint8();
      reader.readUint8();
      errorCode = reader.readInt32();
    }

    return new ygopro.YgoStocMsg({
      stoc_error_msg: new ygopro.StocErrorMsg({
        error_type: errorType,
        error_code: errorCode,
      }),
    });
  }
}

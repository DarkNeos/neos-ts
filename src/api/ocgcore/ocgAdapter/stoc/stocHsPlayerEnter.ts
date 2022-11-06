import { ygopro } from "../../idl/ocgcore";
import { YgoProPacket, StocAdapter } from "../packet";
import { UTF16_BUFFER_MAX_LEN } from "../util";

const UINT8_PER_UINT16 = 2;

/*
 * STOC HsPlayerEnter
 *
 * @param name: [unsigned short; 20] - 玩家昵称
 * @param pos: unsigned chat - 玩家进入房间的位置
 *
 * @usage - 有新玩家进入房间，更新状态
 * */
export default class HsPlayerEnterAdapter implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    const exData = this.packet.exData;

    const decoder = new TextDecoder("utf-16");
    const name = decoder.decode(
      exData.slice(0, UTF16_BUFFER_MAX_LEN * UINT8_PER_UINT16)
    );

    const dataView = new DataView(exData.buffer);
    const pos =
      dataView.getUint8(UTF16_BUFFER_MAX_LEN * UINT8_PER_UINT16) & 0x3;

    return new ygopro.YgoStocMsg({
      stoc_hs_player_enter: new ygopro.StocHsPlayerEnter({
        name,
        pos,
      }),
    });
  }
}

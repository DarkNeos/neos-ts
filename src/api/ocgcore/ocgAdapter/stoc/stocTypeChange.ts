import { ygopro } from "../../idl/ocgcore";
import { YgoProPacket, StocAdapter } from "../packet";

/*
 * STOC TypeChange
 *
 * @param todo
 *
 * @usage - 更新玩家状态
 * */
export default class TypeChangeAdapter implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    const type_ = new DataView(this.packet.exData.buffer).getUint8(0);
    const isHost = ((type_ >> 4) & 0xf) != 0;

    let selfType = ygopro.StocTypeChange.SelfType.UNKNOWN;
    switch (type_ & 0xf) {
      case 0: {
        selfType = ygopro.StocTypeChange.SelfType.PLAYER1;

        break;
      }
      case 1: {
        selfType = ygopro.StocTypeChange.SelfType.PLAYER2;

        break;
      }
      case 2: {
        selfType = ygopro.StocTypeChange.SelfType.PLAYER3;

        break;
      }
      case 3: {
        selfType = ygopro.StocTypeChange.SelfType.PLAYER4;

        break;
      }
      case 4: {
        selfType = ygopro.StocTypeChange.SelfType.PLAYER5;

        break;
      }
      case 5: {
        selfType = ygopro.StocTypeChange.SelfType.PLAYER6;

        break;
      }
    }

    return new ygopro.YgoStocMsg({
      stoc_type_change: new ygopro.StocTypeChange({
        self_type: selfType,
        is_host: isHost,
      }),
    });
  }
}

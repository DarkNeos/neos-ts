import { ygopro } from "../../idl/ocgcore";
import { StocAdapter, YgoProPacket } from "../packet";

/*
 * STOC Chat
 *
 * @param player: unsigned short - 玩家编号
 * @param message: [unsigned short] - 聊天消息文本
 *
 * @usage - 更新聊天消息
 * */
export default class ChatAdapter implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    const player = new DataView(this.packet.exData.buffer).getInt16(0, true);

    const decoder = new TextDecoder("utf-16");
    const msg = decoder.decode(this.packet.exData.slice(2));

    return new ygopro.YgoStocMsg({
      stoc_chat: new ygopro.StocChat({
        player,
        msg,
      }),
    });
  }
}

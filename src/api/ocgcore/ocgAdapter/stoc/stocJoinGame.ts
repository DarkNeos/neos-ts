import { BufferReader } from "@/infra";

import { ygopro } from "../../idl/ocgcore";
import { StocAdapter, YgoProPacket } from "../packet";

/*
 * STOC JoinGame
 *
 * @usage - 告知客户端/前端已成功加入房间
 * */
export default class JoinGameAdapter implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    // HostInfo 至少需要 20 字节；短包保留默认值，由训练规则校验拒绝。
    const info = new ygopro.StocJoinGame({ time_limit: -1 });
    if (this.packet.exData.byteLength >= 20) {
      const reader = new BufferReader(this.packet.exData);
      info.lflist = reader.readUint32();
      info.rule = reader.readUint8();
      info.mode = reader.readUint8();
      info.duel_rule = reader.readUint8();
      info.no_check_deck = reader.readUint8() !== 0;
      info.no_shuffle_deck = reader.readUint8() !== 0;
      // C++ 结构体在布尔字段后补齐到偏移 12，之后是 LP、起手和时限。
      reader.setOffset(12);
      info.start_lp = reader.readUint32();
      info.start_hand = reader.readUint8();
      info.draw_count = reader.readUint8();
      info.time_limit = reader.readUint16();
    }
    return new ygopro.YgoStocMsg({
      stoc_join_game: info,
    });
  }
}

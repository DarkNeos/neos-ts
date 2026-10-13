/*
 * Adapter模块的抽象层。
 *
 * */
import { ygopro } from "../idl/ocgcore";

const littleEndian: boolean = true;
const PACKET_MIN_LEN = 3;

// Ref: https://www.icode9.com/content-1-1341344.html
export class YgoProPacket {
  packetLen: number; // 数据包长度
  proto: number; // ygopro协议标识
  exData: Uint8Array; // 数据包内容

  constructor(packetLen: number, proto: number, exData: Uint8Array) {
    this.packetLen = packetLen;
    this.proto = proto;
    this.exData = exData;
  }

  /*
   * 将[`ygoProPacket`]对象序列化，
   * 返回的二进制数数组可通过长连接发送到ygopro服务端。
   *
   * */
  serialize(): Uint8Array {
    const array = new Uint8Array(this.packetLen + 2);
    const dataView = new DataView(array.buffer);

    dataView.setUint16(0, this.packetLen, littleEndian);
    dataView.setUint8(2, this.proto);
    array.set(this.exData, 3);

    return array;
  }

  /*
   * 将二进制数据反序列化成[`ygoProPacket`]对象，
   * 返回值可用于业务逻辑处理。
   *
   * */
  static deserialize(array: ArrayBuffer): YgoProPacket[] {
    // 一个 WebSocket 消息可能包含多个协议包，逐包读取并检查完整边界。
    const packets = [];
    const dataView = new DataView(array);
    let offset = 0;
    while (offset < array.byteLength) {
      if (array.byteLength - offset < PACKET_MIN_LEN)
        throw new Error("对局数据包头不完整");
      const packetLen = dataView.getUint16(offset, littleEndian);
      // 长度包含 1 字节协议标识和数据，不包含前面的 2 字节长度字段。
      if (packetLen < 1 || offset + packetLen + 2 > array.byteLength)
        throw new Error("对局数据包长度无效");
      const proto = dataView.getUint8(offset + 2);
      const exData = array.slice(offset + 3, offset + packetLen + 2);

      packets.push(new YgoProPacket(packetLen, proto, new Uint8Array(exData)));

      offset += packetLen + 2;
    }

    return packets;
  }
}

export interface StocAdapter {
  upcast(): ygopro.YgoStocMsg;
}

export interface CtosAdapter {
  readonly protobuf: ygopro.YgoCtosMsg;

  downcast(): YgoProPacket;
}

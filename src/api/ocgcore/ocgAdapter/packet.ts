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
    try {
      if (array.byteLength < PACKET_MIN_LEN) {
        throw new Error(
          "Packet length too short, length = " + array.byteLength,
        );
      }
    } catch (e) {
      console.error(e);
    }

    // 由于srvpro实现问题，目前可能出现粘包的情况，因此这里做下解包
    const packets = [];

    let offset = 0;
    while (true) {
      const buffer = array.slice(offset);

      if (buffer.byteLength < PACKET_MIN_LEN) {
        // 解包结束
        break;
      }

      const dataView = new DataView(buffer);
      const packetLen = dataView.getInt16(0, littleEndian);
      const proto = dataView.getInt8(2);
      const exData = buffer.slice(3, packetLen + 2);

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

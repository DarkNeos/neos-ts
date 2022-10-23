import { ygopro } from "../idl/ocgcore";

const littleEndian: boolean = true;
const PACKET_MIN_LEN = 3;

export class ygoProPacket {
  packetLen: number;
  proto: number;
  exData: Uint8Array;

  constructor(packetLen: number, proto: number, exData: Uint8Array) {
    this.packetLen = packetLen;
    this.proto = proto;
    this.exData = exData;
  }

  serialize(): Uint8Array {
    const array = new Uint8Array(this.packetLen + 2);
    const dataView = new DataView(array.buffer);

    dataView.setUint16(0, this.packetLen, littleEndian);
    dataView.setUint8(2, this.proto);
    array.set(this.exData, 3);

    return array;
  }
}

export class ygoArrayBuilder extends ygoProPacket {
  constructor(array: ArrayBuffer) {
    try {
      if (array.byteLength < PACKET_MIN_LEN) {
        throw new Error(
          "Packet length too short, length = " + array.byteLength
        );
      }
    } catch (e) {
      console.log("[e][ygoProPacket][constructor]" + e);
    }

    const dataView = new DataView(array);

    const packetLen = dataView.getInt16(0, littleEndian);
    const proto = dataView.getInt8(2);
    const exData = array.slice(3, packetLen + 2);

    super(packetLen, proto, new Uint8Array(exData));
  }
}

export interface ygoProtobuf {
  readonly packet: ygoProPacket;

  adapt(): ygopro.YgoStocMsg;
}

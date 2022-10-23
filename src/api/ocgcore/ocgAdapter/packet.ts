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
    const packetLen = this.packetLen || 0;
    const proto = this.proto || 0;
    const exData = this.exData || new Uint8Array();

    const array = new Uint8Array(packetLen + 2);
    const dataView = new DataView(array);

    dataView.setUint16(0, packetLen, littleEndian);
    dataView.setUint8(2, proto);
    array.slice(3, packetLen + 2).set(exData);

    return array;
  }
}

export class ygoArrayBuilder extends ygoProPacket {
  constructor(array: Uint8Array) {
    try {
      if (array.length < PACKET_MIN_LEN) {
        throw new Error("Packet length too short, length = " + array.length);
      } else {
        const dataView = new DataView(array);

        const packetLen = dataView.getInt16(0, littleEndian);
        const proto = dataView.getInt8(2);
        const exData = array.slice(3, packetLen + 2);

        super(packetLen, proto, exData);
      }
    } catch (e) {
      console.log("[e][ygoProPacket][constructor]" + e);
    }
  }
}

export interface ygoProtobuf {
  readonly packet: ygoProPacket;

  adapt(): ygopro.YgoStocMsg;
}

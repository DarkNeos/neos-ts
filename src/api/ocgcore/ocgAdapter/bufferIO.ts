import { ygopro } from "../idl/ocgcore";

const OFFSET_UINT8 = 1;
const OFFSET_INT8 = 1;
const OFFSET_UINT16 = 2;
const OFFSET_UINT32 = 4;
const OFFSET_INT32 = 4;

export class BufferReader {
  dataView: DataView;
  littleEndian: boolean;
  offset: number;

  constructor(data: Uint8Array, littleEndian: boolean) {
    this.dataView = new DataView(data.buffer);
    this.littleEndian = littleEndian;
    this.offset = 0;
  }

  readUint8(): number {
    const ret = this.dataView.getUint8(this.offset);
    this.offset += OFFSET_UINT8;

    return ret;
  }

  readInt8(): number {
    const ret = this.dataView.getInt8(this.offset);
    this.offset += OFFSET_INT8;

    return ret;
  }

  readUint16(): number {
    const ret = this.dataView.getUint16(this.offset, this.littleEndian);
    this.offset += OFFSET_UINT16;

    return ret;
  }

  readUint32(): number {
    const ret = this.dataView.getUint32(this.offset, this.littleEndian);
    this.offset += OFFSET_UINT32;

    return ret;
  }

  readInt32(): number {
    const ret = this.dataView.getInt32(this.offset, this.littleEndian);
    this.offset += OFFSET_INT32;

    return ret;
  }

  readCardInfo(): ygopro.StocGameMessage.CardInfo {
    const cardInfo = new ygopro.StocGameMessage.CardInfo({});

    cardInfo.code = this.readUint32();
    cardInfo.controler = this.readUint8();
    cardInfo.location = this.readUint8();
    cardInfo.sequence = this.readUint8();

    return cardInfo;
  }
}

export class BufferWriter {
  dataView: DataView;
  littleEndian: boolean;
  offset: number;

  constructor(data: Uint8Array, littleEndian: boolean) {
    this.dataView = new DataView(data.buffer);
    this.littleEndian = littleEndian;
    this.offset = 0;
  }

  writeUint8(value: number) {
    this.dataView.setUint8(this.offset, value);
    this.offset += OFFSET_UINT8;
  }

  writeInt8(value: number) {
    this.dataView.setInt8(this.offset, value);
    this.offset += OFFSET_INT8;
  }

  writeUint32(value: number) {
    this.dataView.setUint32(this.offset, value, this.littleEndian);
    this.offset += OFFSET_UINT32;
  }
}

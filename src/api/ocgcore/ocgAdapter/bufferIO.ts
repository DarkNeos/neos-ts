import { ygopro } from "../idl/ocgcore";
import { numberToCardPosition, numberToCardZone } from "./util";

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

  readCardInfo(): ygopro.CardInfo {
    const code = this.readUint32();
    const controler = this.readUint8();
    const location = numberToCardZone(this.readUint8());
    const sequence = this.readUint8();

    return new ygopro.CardInfo({
      code,
      controler,
      location,
      sequence,
    });
  }

  readCardLocation(overlay?: boolean): ygopro.CardLocation {
    const controler = this.readUint8();
    const location = this.readUint8();
    const sequence = this.readUint8();
    const ss = this.readUint8();

    const cardLocation = new ygopro.CardLocation({
      controler,
      location: numberToCardZone(location),
      sequence,
    });

    if (overlay && overlay) {
      cardLocation.overlay_sequence = ss;
    } else {
      const position = numberToCardPosition(ss);
      if (position) {
        cardLocation.position = position;
      }
    }

    return cardLocation;
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

  writeInt32(value: number) {
    this.dataView.setInt32(this.offset, value, this.littleEndian);
    this.offset += OFFSET_INT32;
  }
}

import { ygopro } from "../idl/ocgcore";
import { numberToCardPosition, numberToCardZone } from "./util";
// @ts-ignore
import { BufferReader } from "rust-src";

const OFFSET_UINT8 = 1;
const OFFSET_INT8 = 1;
const OFFSET_UINT32 = 4;
const OFFSET_INT32 = 4;
const LOCATION_OVERLAY = 0x80;

export class BufferReaderExt {
  inner: BufferReader;

  constructor(data: Uint8Array) {
    this.inner = new BufferReader(data);
  }

  readCardInfo(): ygopro.CardInfo {
    const code = this.inner.readUint32();
    const controler = this.inner.readUint8();
    const location = numberToCardZone(this.inner.readUint8());
    const sequence = this.inner.readUint8();

    return new ygopro.CardInfo({
      code,
      controler,
      location,
      sequence,
    });
  }

  readCardLocation(): ygopro.CardLocation {
    const controler = this.inner.readUint8();
    const location = this.inner.readUint8();
    const sequence = this.inner.readUint8();
    const ss = this.inner.readUint8();

    if (location & LOCATION_OVERLAY) {
      // 超量素材
      return new ygopro.CardLocation({
        controler,
        location: ygopro.CardZone.OVERLAY,
        sequence,
        overlay_sequence: ss,
      });
    } else {
      return new ygopro.CardLocation({
        controler,
        location: numberToCardZone(location),
        sequence,
        position: numberToCardPosition(ss),
      });
    }
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

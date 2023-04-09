import { ygopro } from "../idl/ocgcore";
import { numberToCardPosition, numberToCardZone } from "./util";
import { BufferReader } from "rust-src";

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

  readCardShortLocation(): ygopro.CardLocation {
    const controler = this.inner.readUint8();
    const location = this.inner.readUint8();
    const sequence = this.inner.readUint8();

    return new ygopro.CardLocation({
      controler,
      location: numberToCardZone(location),
      sequence,
    });
  }
}

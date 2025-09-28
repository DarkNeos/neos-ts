import { BufferReader } from "@/infra";

import { ygopro } from "../idl/ocgcore";
import { numberToCardPosition, numberToCardZone } from "./util";

const LOCATION_OVERLAY = 0x80;

export class BufferReaderExt {
  inner: BufferReader;

  constructor(data: Uint8Array) {
    this.inner = new BufferReader(data);
  }

  readCardInfo(): ygopro.CardInfo {
    const code = this.inner.readUint32();
    const controller = this.inner.readUint8();
    const location = numberToCardZone(this.inner.readUint8());
    const sequence = this.inner.readUint8();

    return new ygopro.CardInfo({
      code,
      controller,
      location,
      sequence,
    });
  }

  readCardLocation(): ygopro.CardLocation {
    const controller = this.inner.readUint8();
    const location = this.inner.readUint8();
    const sequence = this.inner.readUint8();
    const ss = this.inner.readUint8();

    if (location & LOCATION_OVERLAY) {
      // 超量素材
      return new ygopro.CardLocation({
        controller,
        zone: numberToCardZone(location & ~LOCATION_OVERLAY),
        sequence,
        is_overlay: true,
        overlay_sequence: ss,
      });
    } else {
      return new ygopro.CardLocation({
        controller,
        zone: numberToCardZone(location),
        sequence,
        is_overlay: false,
        position: numberToCardPosition(ss),
      });
    }
  }

  readCardShortLocation(): ygopro.CardLocation {
    const controller = this.inner.readUint8();
    const location = this.inner.readUint8();
    const sequence = this.inner.readUint8();

    return new ygopro.CardLocation({
      controller,
      zone: numberToCardZone(location),
      sequence,
    });
  }
}

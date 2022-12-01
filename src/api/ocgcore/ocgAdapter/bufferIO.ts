const OFFSET_UINT8 = 1;
const OFFSET_INT8 = 1;
const OFFSET_UINT16 = 2;
const OFFSET_UINT32 = 4;

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
    const ret = this.dataView.getUint16(this.offset);
    this.offset += OFFSET_UINT16;

    return ret;
  }

  readUint32(): number {
    const ret = this.dataView.getUint32(this.offset, this.littleEndian);
    this.offset += OFFSET_UINT32;

    return ret;
  }
}

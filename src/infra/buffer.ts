export class BufferReader {
  private dataView: DataView;
  private _offset: number;

  /**
   * Constructor that takes a Uint8Array as the data source
   * @param array The binary array to read from
   */
  constructor(array: Uint8Array) {
    this.dataView = new DataView(
      array.buffer,
      array.byteOffset,
      array.byteLength,
    );
    this._offset = 0;
  }

  /**
   * Reads an unsigned 8-bit integer
   * @returns The read value
   */
  readUint8(): number {
    const value = this.dataView.getUint8(this._offset);
    this._offset += 1;
    return value;
  }

  /**
   * Reads a signed 8-bit integer
   * @returns The read value
   */
  readInt8(): number {
    const value = this.dataView.getInt8(this._offset);
    this._offset += 1;
    return value;
  }

  /**
   * Reads an unsigned 16-bit integer (little-endian)
   * @returns The read value
   */
  readUint16(): number {
    const value = this.dataView.getUint16(this._offset, true);
    this._offset += 2;
    return value;
  }

  /**
   * Reads an unsigned 32-bit integer (little-endian)
   * @returns The read value
   */
  readUint32(): number {
    const value = this.dataView.getUint32(this._offset, true);
    this._offset += 4;
    return value;
  }

  /**
   * Reads a signed 32-bit integer (little-endian)
   * @returns The read value
   */
  readInt32(): number {
    const value = this.dataView.getInt32(this._offset, true);
    this._offset += 4;
    return value;
  }

  /**
   * Gets the current offset position
   * @returns The current offset
   */
  offset(): number {
    return this._offset;
  }

  /**
   * Sets the offset position
   * @param offset The new offset value
   */
  setOffset(offset: number): void {
    // Ensure offset is within valid range
    if (offset < 0 || offset > this.dataView.byteLength) {
      throw new Error(`Invalid offset: ${offset}`);
    }
    this._offset = offset;
  }
}

export class BufferWriter {
  private buffer: ArrayBuffer;
  private dataView: DataView;
  private length: number;
  private capacity: number;

  /**
   * Constructor that creates a new BufferWriter instance
   */
  constructor() {
    // Initial capacity set to 1024 bytes, will auto-expand
    this.capacity = 1024;
    this.buffer = new ArrayBuffer(this.capacity);
    this.dataView = new DataView(this.buffer);
    this.length = 0;
  }

  /**
   * Ensures the buffer has enough capacity
   * @param additional Number of additional bytes needed
   */
  private ensureCapacity(additional: number): void {
    while (this.length + additional > this.capacity) {
      this.capacity *= 2;
      const newBuffer = new ArrayBuffer(this.capacity);
      const newDataView = new DataView(newBuffer);

      // Copy existing data
      for (let i = 0; i < this.length; i++) {
        newDataView.setUint8(i, this.dataView.getUint8(i));
      }

      this.buffer = newBuffer;
      this.dataView = newDataView;
    }
  }

  /**
   * Writes an unsigned 8-bit integer
   * @param value The value to write
   */
  writeUint8(value: number): void {
    this.ensureCapacity(1);
    this.dataView.setUint8(this.length, value);
    this.length += 1;
  }

  /**
   * Writes a signed 8-bit integer
   * @param value The value to write
   */
  writeInt8(value: number): void {
    this.ensureCapacity(1);
    this.dataView.setInt8(this.length, value);
    this.length += 1;
  }

  /**
   * Writes an unsigned 16-bit integer (little-endian)
   * @param value The value to write
   */
  writeUint16(value: number): void {
    this.ensureCapacity(2);
    this.dataView.setUint16(this.length, value, true);
    this.length += 2;
  }

  /**
   * Writes a signed 16-bit integer (little-endian)
   * @param value The value to write
   */
  writeInt16(value: number): void {
    this.ensureCapacity(2);
    this.dataView.setInt16(this.length, value, true);
    this.length += 2;
  }

  /**
   * Writes an unsigned 32-bit integer (little-endian)
   * @param value The value to write
   */
  writeUint32(value: number): void {
    this.ensureCapacity(4);
    this.dataView.setUint32(this.length, value, true);
    this.length += 4;
  }

  /**
   * Writes a signed 32-bit integer (little-endian)
   * @param value The value to write
   */
  writeInt32(value: number): void {
    this.ensureCapacity(4);
    this.dataView.setInt32(this.length, value, true);
    this.length += 4;
  }

  /**
   * Converts the written data to a Uint8Array
   * @returns Uint8Array containing the written data
   */
  toArray(): Uint8Array {
    return new Uint8Array(this.buffer, 0, this.length);
  }
}

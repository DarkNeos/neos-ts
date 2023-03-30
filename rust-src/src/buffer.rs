//! Raw Buffer 解析工具
//!
//! 在Javascript/Typescript中数字类型只有`numbuer`，
//! 要做二进制数组的解析需要用[`DataView`]，比较复杂，且性能不佳。
//! 因此这里用WASM实现两个基础的二进制数据解析模块[`BufferReader`]和[`BufferWriter`]。

use wasm_bindgen::prelude::wasm_bindgen;

const OFFSET_UINT8: usize = 1;
const OFFSET_INT8: usize = 1;
const OFFSET_UINT16: usize = 2;
const OFFSET_UINT32: usize = 4;
const OFFSET_INT32: usize = 4;

#[wasm_bindgen]
pub struct BufferReader {
    array: Vec<u8>,
    offset: usize,
}

#[wasm_bindgen]
impl BufferReader {
    #[wasm_bindgen(constructor)]
    pub fn new(array: js_sys::Uint8Array) -> Self {
        Self {
            array: array.to_vec(),
            offset: 0,
        }
    }

    pub fn readUint8(&mut self) -> u8 {
        let ret = self.array[self.offset];
        self.offset += OFFSET_UINT8;

        ret
    }

    pub fn readInt8(&mut self) -> i8 {
        let ret = self.array[self.offset] as i8;
        self.offset += OFFSET_INT8;

        ret
    }

    pub fn readUint16(&mut self) -> u16 {
        let ret = self.array[self.offset..self.offset + OFFSET_UINT16]
            .try_into()
            .map(u16::from_le_bytes)
            .unwrap();
        self.offset += OFFSET_UINT16;

        ret
    }

    pub fn readUint32(&mut self) -> u32 {
        let ret = self.array[self.offset..self.offset + OFFSET_UINT32]
            .try_into()
            .map(u32::from_le_bytes)
            .unwrap();
        self.offset += OFFSET_UINT32;

        ret
    }

    pub fn readInt32(&mut self) -> i32 {
        let ret = self.array[self.offset..self.offset + OFFSET_INT32]
            .try_into()
            .map(i32::from_le_bytes)
            .unwrap();
        self.offset += OFFSET_INT32;

        ret
    }

    pub fn offset(&self) -> usize {
        self.offset
    }

    pub fn setOffset(&mut self, offset: usize) {
        self.offset = offset;
    }
}

#[wasm_bindgen]
pub struct BufferWriter {
    array: Vec<u8>,
}

#[wasm_bindgen]
impl BufferWriter {
    #[wasm_bindgen(constructor)]
    #[allow(clippy::new_without_default)]
    pub fn new() -> Self {
        Self { array: Vec::new() }
    }

    pub fn writeUint8(&mut self, value: u8) {
        self.array.push(value);
    }

    pub fn writeInt8(&mut self, value: i8) {
        self.array.extend(value.to_le_bytes());
    }

    pub fn writeUint16(&mut self, value: u16) {
        self.array.extend(value.to_le_bytes());
    }

    pub fn writeInt16(&mut self, value: i16) {
        self.array.extend(value.to_le_bytes());
    }

    pub fn writeUint32(&mut self, value: u32) {
        self.array.extend(value.to_le_bytes());
    }

    pub fn writeInt32(&mut self, value: i32) {
        self.array.extend(value.to_le_bytes());
    }

    pub fn toArray(self) -> Vec<u8> {
        self.array
    }
}

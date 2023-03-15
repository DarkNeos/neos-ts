use wasm_bindgen::prelude::wasm_bindgen;
use std::convert::TryInto;

#[wasm_bindgen]
pub struct MsgUpdateHp {
    pub player: Option<u8>,
    pub type_: Option<u8>,
    pub value: Option<i32>,
}

#[repr(u8)]
enum ActionType {
    _Unknown = 0,
    Damage = 1,
    _Recover = 2,
}

#[wasm_bindgen]
pub fn ocgDamageAdapter(data: js_sys::Uint8Array) -> MsgUpdateHp {
    let data = data.to_vec();

    let player = data[0];
    let value = data[1..5].try_into().map(i32::from_le_bytes).ok();

    MsgUpdateHp {
        player: Some(player),
        type_: Some(ActionType::Damage as u8),
        value,
    }
}

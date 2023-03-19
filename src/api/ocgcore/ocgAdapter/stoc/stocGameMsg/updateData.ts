import {
  QUERY_ALIAS,
  QUERY_ATTACK,
  QUERY_ATTRIBUTE,
  QUERY_BASE_ATTACK,
  QUERY_BASE_DEFENSE,
  QUERY_CODE,
  QUERY_COUNTERS,
  QUERY_DEFENSE,
  QUERY_EQUIP_CARD,
  QUERY_LEVEL,
  QUERY_LINK,
  QUERY_LSCALE,
  QUERY_OVERLAY_CARD,
  QUERY_OWNER,
  QUERY_POSITION,
  QUERY_RACE,
  QUERY_RANK,
  QUERY_REASON,
  QUERY_REASON_CARD,
  QUERY_RSCALE,
  QUERY_STATUS,
  QUERY_TARGET_CARD,
  QUERY_TYPE,
} from "../../../../../common";
import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import { numberToCardZone } from "../../util";
import MsgUpdateData = ygopro.StocGameMessage.MsgUpdateData;

/*
 * Msg UpdateData
 *
 * @param - todo
 *
 * @usage - ygopro后端通知前端更新卡片元数据
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const player = reader.inner.readUint8();
  const zone = numberToCardZone(reader.inner.readUint8());

  const msg = new MsgUpdateData({
    player,
    zone,
    actions: [],
  });

  try {
    while (true) {
      const len = reader.inner.readInt32();
      if (len == 4) continue;
      const pos = reader.inner.offset();
      const action = _readUpdateAction(reader);
      if (action) {
        msg.actions.push(action);
      }
      reader.inner.setOffset(pos + len - 4);
    }
  } catch (e) {
    // console.log(e)
  }
};

function _readUpdateAction(
  reader: BufferReaderExt
): MsgUpdateData.Action | undefined {
  const flag = reader.inner.readInt32();
  if (flag == 0) return undefined;

  let code;
  let location;
  let alias;
  let type_;
  let level;
  let rank;
  let attribute;
  let race;
  let attack;
  let defense;
  let base_attack;
  let base_defense;
  let reason;
  let reason_card;
  let equip_card;
  let target_cards = [];
  let overlay_cards = [];
  let counters = new Map<number, number>();
  let owner;
  let status;
  let lscale;
  let rscale;
  let link;

  if (flag & QUERY_CODE) {
    code = reader.inner.readInt32();
  }
  if (flag & QUERY_POSITION) {
    location = reader.readCardLocation();
  }
  if (flag & QUERY_ALIAS) {
    alias = reader.inner.readInt32();
  }
  if (flag & QUERY_TYPE) {
    type_ = reader.inner.readInt32();
  }
  if (flag & QUERY_LEVEL) {
    level = reader.inner.readInt32();
  }
  if (flag & QUERY_RANK) {
    rank = reader.inner.readInt32();
  }
  if (flag & QUERY_ATTRIBUTE) {
    attribute = reader.inner.readInt32();
  }
  if (flag & QUERY_RACE) {
    race = reader.inner.readInt32();
  }
  if (flag & QUERY_ATTACK) {
    attack = reader.inner.readInt32();
  }
  if (flag & QUERY_DEFENSE) {
    defense = reader.inner.readInt32();
  }
  if (flag & QUERY_BASE_ATTACK) {
    base_attack = reader.inner.readInt32();
  }
  if (flag & QUERY_BASE_DEFENSE) {
    base_defense = reader.inner.readInt32();
  }
  if (flag & QUERY_REASON) {
    reason = reader.inner.readInt32();
  }
  if (flag & QUERY_REASON_CARD) {
    reason_card = reader.inner.readInt32();
  }
  if (flag & QUERY_EQUIP_CARD) {
    equip_card = reader.readCardLocation();
  }
  if (flag & QUERY_TARGET_CARD) {
    const count = reader.inner.readInt32();
    for (let i = 0; i < count; i += 1) {
      target_cards.push(reader.readCardLocation());
    }
  }
  if (flag & QUERY_OVERLAY_CARD) {
    const count = reader.inner.readInt32();
    for (let i = 0; i < count; i += 1) {
      overlay_cards.push(reader.inner.readInt32());
    }
  }
  if (flag & QUERY_COUNTERS) {
    const count = reader.inner.readInt32();
    for (let i = 0; i < count; i += 1) {
      const ctype = reader.inner.readUint16();
      const ccount = reader.inner.readUint16();
      counters.set(ctype, ccount);
    }
  }
  if (flag & QUERY_OWNER) {
    owner = reader.inner.readInt32();
  }
  if (flag & QUERY_STATUS) {
    status = reader.inner.readInt32();
  }
  if (flag & QUERY_LSCALE) {
    lscale = reader.inner.readInt32();
  }
  if (flag & QUERY_RSCALE) {
    rscale = reader.inner.readInt32();
  }
  if (flag & QUERY_LINK) {
    link = reader.inner.readInt32();
  }

  return new MsgUpdateData.Action({
    code,
    location,
    alias,
    type_,
    level,
    rank,
    attribute,
    race,
    attack,
    defense,
    base_attack,
    base_defense,
    reason,
    reason_card,
    equip_card,
    target_cards,
    overlay_cards,
    counters,
    owner,
    status,
    lscale,
    rscale,
    link,
  });
}

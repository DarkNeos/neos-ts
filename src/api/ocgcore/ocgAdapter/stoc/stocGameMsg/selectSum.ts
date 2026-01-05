import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import MsgSelectSum = ygopro.StocGameMessage.MsgSelectSum;

/*
 * Msg Select Sum
 *
 * @param -
 *
 * @usage -
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const overflow = reader.inner.readUint8();
  const player = reader.inner.readUint8();
  const level = reader.inner.readInt32();
  const min = reader.inner.readUint8();
  const max = reader.inner.readUint8();

  const msg = new MsgSelectSum({
    overflow,
    player,
    level_sum: level,
    min,
    max,
    must_select_cards: [],
    selectable_cards: [],
  });

  const mustCount = reader.inner.readUint8();
  for (let i = 0; i < mustCount; i++) {
    const code = reader.inner.readInt32();
    const location = reader.readCardShortLocation();
    const para = reader.inner.readInt32();

    let level1 = para & 0xffff;
    let level2 = para >> 16;
    // 检查 0x80000000 标志位
    if ((para & 0x80000000) !== 0) {
      level1 = para & 0x7fffffff;
      level2 = level1;
    }
    if (level2 === 0) {
      level2 = level1;
    }

    msg.must_select_cards.push(
      new MsgSelectSum.Info({
        code,
        location,
        level1,
        level2,
        response: i,
      }),
    );
  }

  const selectAbleCount = reader.inner.readUint8();
  for (let i = 0; i < selectAbleCount; i++) {
    const code = reader.inner.readInt32();
    const location = reader.readCardShortLocation();
    const para = reader.inner.readInt32();

    let level1 = para & 0xffff;
    let level2 = para >> 16;
    // 检查 0x80000000 标志位
    if ((para & 0x80000000) !== 0) {
      level1 = para & 0x7fffffff;
      level2 = level1;
    }
    if (level2 === 0) {
      level2 = level1;
    }

    msg.selectable_cards.push(
      new MsgSelectSum.Info({
        code,
        location,
        level1,
        level2,
        response: i,
      }),
    );
  }

  return msg;
};

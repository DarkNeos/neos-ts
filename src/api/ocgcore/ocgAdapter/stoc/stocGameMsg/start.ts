import { ygopro } from "../../../idl/ocgcore";

const LITTLE_ENDIAN = true;
const INT16_BYTE_OFFSET = 2;
const INT32_BYTE_OFFSET = 4;

/*
 * MSG Start
 *
 * @param todo
 *
 * @usage - 服务端在决斗开始时告诉前端/客户端双方的基础信息
 * */
export default (data: Uint8Array) => {
  const dataView = new DataView(data.buffer);

  // TODO: use `BufferIO`
  const pT = dataView.getUint8(0);
  const playerType =
    (pT & 0xf) <= 0
      ? ygopro.StocGameMessage.MsgStart.PlayerType.FirstStrike
      : (pT & 0xf0) > 0
      ? ygopro.StocGameMessage.MsgStart.PlayerType.Observer
      : ygopro.StocGameMessage.MsgStart.PlayerType.SecondStrike;

  let offset = 1;
  if (dataView.byteLength > 17) {
    // data长度大于17，会多传一个大师规则字段
    const masterRule = dataView.getUint8(offset); // TODO

    offset += 1;
  }

  const life1 = dataView.getInt32(offset, LITTLE_ENDIAN);
  offset += INT32_BYTE_OFFSET;
  const life2 = dataView.getInt32(offset, LITTLE_ENDIAN);
  offset += INT32_BYTE_OFFSET;

  const deckSize1 = dataView.getInt16(offset, LITTLE_ENDIAN);
  offset += INT16_BYTE_OFFSET;
  const extraSize1 = dataView.getInt16(offset, LITTLE_ENDIAN);
  offset += INT16_BYTE_OFFSET;

  const deckSize2 = dataView.getInt16(offset, LITTLE_ENDIAN);
  offset += INT16_BYTE_OFFSET;
  const extraSize2 = dataView.getInt16(offset, LITTLE_ENDIAN);
  offset += INT16_BYTE_OFFSET;

  return new ygopro.StocGameMessage.MsgStart({
    playerType,
    life1,
    life2,
    deckSize1,
    deckSize2,
    extraSize1,
    extraSize2,
  });
};

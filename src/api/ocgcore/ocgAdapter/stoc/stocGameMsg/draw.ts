import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "../../bufferIO";

const LITTLE_ENDIAN = true;

/*
 * MSG Draw
 *
 * @param player: char - 玩家编号
 *
 * @usage - 玩家抽卡内容
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReader(data, LITTLE_ENDIAN);

  const player = reader.readUint8();
  const count = reader.readUint8();

  let cards: number[] = [];
  for (let i = 0; i < count; i++) {
    cards.push(reader.readUint32());
  }

  return new ygopro.StocGameMessage.MsgDraw({
    player,
    count,
    cards,
  });
};

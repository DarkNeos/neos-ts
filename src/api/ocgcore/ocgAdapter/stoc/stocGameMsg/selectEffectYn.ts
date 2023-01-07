import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "../../bufferIO";
import MsgSelectEffectYn = ygopro.StocGameMessage.MsgSelectEffectYn;

/*
 * Msg Select EffectYn
 *
 * @param - see: https://code.mycard.moe/mycard/neos-protobuf/-/blob/main/idl/ocgcore.neos-protobuf
 * @usage - 玩家选择是否发动效果
 *
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReader(data, true);

  const player = reader.readUint8();
  const code = reader.readUint32();
  const location = reader.readCardLocation();
  const effect_description = reader.readUint32();

  return new MsgSelectEffectYn({
    player,
    code,
    location,
    effect_description,
  });
};

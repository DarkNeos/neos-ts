import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import MsgSelectEffectYn = ygopro.StocGameMessage.MsgSelectEffectYn;

/*
 * Msg Select EffectYn
 *
 * @param - see: https://code.mycard.moe/mycard/neos-protobuf/-/blob/main/idl/ocgcore.neos-protobuf
 * @usage - 玩家选择是否发动效果
 *
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const player = reader.inner.readUint8();
  const code = reader.inner.readUint32();
  const location = reader.readCardLocation();
  const effect_description = reader.inner.readUint32();

  return new MsgSelectEffectYn({
    player,
    code,
    location,
    effect_description,
  });
};

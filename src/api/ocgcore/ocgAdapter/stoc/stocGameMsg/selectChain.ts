import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import MsgSelectChain = ygopro.StocGameMessage.MsgSelectChain;
import { numberToChainFlag } from "../../util";

/*
 * Msg Select Chain
 *
 * @param - see: https://code.mycard.moe/mycard/neos-protobuf/-/blob/main/idl/ocgcore.neos-protobuf
 * @usage - 玩家选择连锁
 *
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const player = reader.inner.readUint8();
  const count = reader.inner.readUint8();
  const spCount = reader.inner.readUint8();
  const hint0 = reader.inner.readUint32();
  const hint1 = reader.inner.readUint32();

  const msg = new MsgSelectChain({
    player,
    special_count: spCount,
    forced: false,
    hint0,
    hint1,
    chains: [],
  });

  let forceCount = 0;
  for (let i = 0; i < count; i++) {
    const flag = reader.inner.readUint8();
    const forced = reader.inner.readUint8();
    forceCount += forced;
    const code = reader.inner.readUint32() % 1000000000;
    const location = reader.readCardLocation();
    const effect_desc = reader.inner.readUint32();

    const chain = new MsgSelectChain.Chain({
      flag: numberToChainFlag(flag),
      code,
      location,
      effect_description: effect_desc,
      response: i,
    });
    // 由于 protobuf 定义中 Chain 没有 forced 字段，使用类型扩展
    (chain as any).forced = forced > 0;

    msg.chains.push(chain);
  }

  msg.forced = forceCount > 0;

  return msg;
};

import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "../../bufferIO";
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
  const reader = new BufferReader(data, true);

  const player = reader.readUint8();
  const count = reader.readUint8();
  const spCount = reader.readUint8();
  const forced = reader.readUint8() != 0;
  const hint0 = reader.readUint32();
  const hint1 = reader.readUint32();

  const msg = new MsgSelectChain({
    player,
    special_count: spCount,
    forced,
    hint0,
    hint1,
    chains: [],
  });

  for (let i = 0; i < count; i++) {
    const flag = reader.readUint8();
    const code = reader.readUint32();
    const location = reader.readCardLocation();
    const effect_desc = reader.readUint32();

    msg.chains.push(
      new MsgSelectChain.Chain({
        flag: numberToChainFlag(flag),
        code,
        location,
        effect_description: effect_desc,
        response: i,
      })
    );
  }

  return msg;
};

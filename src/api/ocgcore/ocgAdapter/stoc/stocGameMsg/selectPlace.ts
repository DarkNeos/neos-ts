import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "../../bufferIO";
import MsgSelectPlace = ygopro.StocGameMessage.MsgSelectPlace;

/*
 * Msg Select Place
 *
 * @param - see: https://code.mycard.moe/mycard/neos-protobuf/-/blob/main/idl/ocgcore.proto
 *
 * @usage - 玩家可选择的位置
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReader(data, true);

  const player = reader.readUint8();
  let count = reader.readUint8();
  const _field = ~reader.readUint32();

  // TODO: 暂时和`ygopro2`一样不支持取消操作，后续需要再考虑加上
  if (count == 0) {
    count = 1;
  }
};

import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "../../bufferIO";
import MsgMove = ygopro.StocGameMessage.MsgMove;

/*
 * Msg Move
 * @param - TODO
 *
 * @usage - 服务端告知前端/客户端卡牌移动信息
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReader(data, true);

  const code = reader.readUint32();

  const fromLocation = reader.readCardLocation();
  const toLocation = reader.readCardLocation();

  return new MsgMove({
    code,
    from: fromLocation,
    to: toLocation,
    reason: reader.readUint8(),
  });
};

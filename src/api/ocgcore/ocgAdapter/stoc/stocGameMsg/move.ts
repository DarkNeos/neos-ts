import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import MsgMove = ygopro.StocGameMessage.MsgMove;

/*
 * Msg Move
 * @param - TODO
 *
 * @usage - 服务端告知前端/客户端卡牌移动信息
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const code = reader.inner.readUint32();

  const fromLocation = reader.readCardLocation();
  const toLocation = reader.readCardLocation();

  return new MsgMove({
    code,
    from: fromLocation,
    to: toLocation,
    reason: reader.inner.readUint32(),
  });
};

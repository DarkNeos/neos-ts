import { ygopro } from "@/api/ocgcore/idl/ocgcore";

import { BufferReader } from "../../../../../../rust-src/pkg/rust_src";

/*
 * Msg Hand Result
 * @param - TODO
 *
 * @usage - 后端告诉前端玩家选择的猜拳结果
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReader(data);

  const x = reader.readUint8();
  const result1 = x & 0x3;
  const result2 = (x >> 2) & 0x3;

  return new ygopro.StocGameMessage.MsgHandResult({
    result1,
    result2,
  });
};

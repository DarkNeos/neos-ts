import { ygopro } from "../../../idl/ocgcore";
// @ts-ignore
import { BufferWriter } from "rust-src";

export default (
  response: ygopro.CtosGameMsgResponse.SelectEffectYnResponse
) => {
  const writer = new BufferWriter();

  writer.writeUint32(response.selected ? 1 : 0);

  return writer.toArray();
};

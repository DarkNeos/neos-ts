import { ygopro } from "../../../idl/ocgcore";
// @ts-ignore
import { BufferWriter } from "rust-src";

export default (response: ygopro.CtosGameMsgResponse.SelectChainResponse) => {
  const writer = new BufferWriter();

  writer.writeInt32(response.selected_ptr);

  return writer.toArray();
};

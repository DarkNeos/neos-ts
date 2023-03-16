import { ygopro } from "../../../idl/ocgcore";
// @ts-ignore
import { BufferWriter } from "rust-src";

export default (response: ygopro.CtosGameMsgResponse.SelectCardResponse) => {
  const writer = new BufferWriter();

  writer.writeUint8(response.selected_ptrs.length);
  for (const ptr of response.selected_ptrs) {
    writer.writeUint8(ptr);
  }

  return writer.toArray();
};

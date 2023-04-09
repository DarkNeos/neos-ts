import { ygopro } from "../../../idl/ocgcore";
import { BufferWriter } from "rust-src";

export default (response: ygopro.CtosGameMsgResponse.SortCardResponse) => {
  const writer = new BufferWriter();

  for (const index of response.sorted_index) {
    writer.writeUint8(index);
  }

  return writer.toArray();
};

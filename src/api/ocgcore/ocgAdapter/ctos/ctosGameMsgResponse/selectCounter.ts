import { ygopro } from "../../../idl/ocgcore";
import { BufferWriter } from "rust-src";

export default (response: ygopro.CtosGameMsgResponse.SelectCounterResponse) => {
  const writer = new BufferWriter();

  for (const count of response.selected_count) {
    writer.writeInt16(count);
  }

  return writer.toArray();
};

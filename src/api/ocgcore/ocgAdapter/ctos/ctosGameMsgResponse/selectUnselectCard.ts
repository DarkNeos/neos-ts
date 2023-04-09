import { ygopro } from "../../../idl/ocgcore";

import { BufferWriter } from "rust-src";

export default (
  response: ygopro.CtosGameMsgResponse.SelectUnselectCardResponse
) => {
  const writer = new BufferWriter();
  if (response.cancel_or_finish) {
    writer.writeInt32(-1);
  } else {
    writer.writeUint8(1);
    writer.writeUint8(response.selected_ptr);
  }

  return writer.toArray();
};

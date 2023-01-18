import { ygopro } from "../../../idl/ocgcore";
import { BufferWriter } from "../../bufferIO";

export default (
  response: ygopro.CtosGameMsgResponse.SelectUnselectCardResponse
) => {
  if (response.cancel_or_finish) {
    const array = new Uint8Array(4);
    const writer = new BufferWriter(array, true);

    writer.writeInt32(-1);

    return array;
  } else {
    const array = new Uint8Array(2);
    const writer = new BufferWriter(array, true);

    writer.writeUint8(1);
    writer.writeUint8(response.selected_ptr);

    return array;
  }
};

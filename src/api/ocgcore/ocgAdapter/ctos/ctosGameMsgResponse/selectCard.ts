import { ygopro } from "../../../idl/ocgcore";
import { BufferWriter } from "../../bufferIO";

export default (response: ygopro.CtosGameMsgResponse.SelectCardResponse) => {
  const array = new Uint8Array(1 + response.selected_ptrs.length);
  const writer = new BufferWriter(array, true);

  writer.writeUint8(response.selected_ptrs.length);
  for (const ptr of response.selected_ptrs) {
    writer.writeUint8(ptr);
  }

  return array;
};

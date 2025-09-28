import { BufferWriter } from "@/infra";

import { ygopro } from "../../../idl/ocgcore";

export default (response: ygopro.CtosGameMsgResponse.SelectMultiResponse) => {
  const writer = new BufferWriter();

  writer.writeUint8(response.selected_ptrs.length);
  for (const ptr of response.selected_ptrs) {
    writer.writeUint8(ptr);
  }

  return writer.toArray();
};

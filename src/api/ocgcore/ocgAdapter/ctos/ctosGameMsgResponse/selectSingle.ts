import { BufferWriter } from "@/infra";

import { ygopro } from "../../../idl/ocgcore";

export default (response: ygopro.CtosGameMsgResponse.SelectSingleResponse) => {
  const writer = new BufferWriter();

  writer.writeInt32(response.selected_ptr);

  return writer.toArray();
};

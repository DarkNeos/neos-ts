import { BufferWriter } from "rust-src";

import { ygopro } from "../../../idl/ocgcore";

export default (response: ygopro.CtosGameMsgResponse.SelectIdleCmdResponse) => {
  const writer = new BufferWriter();

  writer.writeUint32(response.code);

  return writer.toArray();
};

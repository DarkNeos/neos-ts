import { BufferWriter } from "rust-src";

import { ygopro } from "../../../idl/ocgcore";

export default (
  response: ygopro.CtosGameMsgResponse.SelectBattleCmdResponse,
) => {
  const writer = new BufferWriter();

  writer.writeUint32(response.selected_cmd);

  return writer.toArray();
};

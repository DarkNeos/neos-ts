import { ygopro } from "../../../idl/ocgcore";
import { BufferWriter } from "../../bufferIO";

export default (
  response: ygopro.CtosGameMsgResponse.SelectBattleCmdResponse
) => {
  const array = new Uint8Array(4);
  const writer = new BufferWriter(array, true);

  writer.writeUint32(response.selected_cmd);

  return array;
};

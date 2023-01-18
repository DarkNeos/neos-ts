import { ygopro } from "../../../idl/ocgcore";
import { BufferWriter } from "../../bufferIO";

export default (response: ygopro.CtosGameMsgResponse.SelectChainResponse) => {
  const array = new Uint8Array(4);
  const writer = new BufferWriter(array, true);

  writer.writeInt32(response.selected_ptr);

  return array;
};

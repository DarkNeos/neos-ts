import { ygopro } from "../../../idl/ocgcore";
import { BufferWriter } from "rust-src";

export default (response: ygopro.CtosGameMsgResponse.SelectOptionResponse) => {
  const writer = new BufferWriter();

  writer.writeUint32(response.code);

  return writer.toArray();
};

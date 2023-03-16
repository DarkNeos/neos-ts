import { ygopro } from "../../../idl/ocgcore";
// @ts-ignore
import { BufferWriter } from "rust-src";
import { cardZoneToNumber } from "../../util";

export default (response: ygopro.CtosGameMsgResponse.SelectPlaceResponse) => {
  const writer = new BufferWriter();

  writer.writeUint8(response.player);
  writer.writeUint8(cardZoneToNumber(response.zone));
  writer.writeUint8(response.sequence);

  return writer.toArray();
};

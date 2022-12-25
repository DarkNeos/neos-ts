import { ygopro } from "../../../idl/ocgcore";
import { BufferWriter } from "../../bufferIO";
import { cardZoneToNumber } from "../../util";

export default (response: ygopro.CtosGameMsgResponse.SelectPlaceResponse) => {
  const array = new Uint8Array(3);
  const writer = new BufferWriter(array, true);

  writer.writeUint8(response.player);
  writer.writeUint8(cardZoneToNumber(response.zone));
  writer.writeUint8(response.sequence);

  return array;
};

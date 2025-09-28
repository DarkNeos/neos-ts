import { BufferWriter } from "@/infra";

import { ygopro } from "../../../idl/ocgcore";
import { cardZoneToNumber } from "../../util";

export default (response: ygopro.CtosGameMsgResponse.SelectPlaceResponse) => {
  const writer = new BufferWriter();

  writer.writeUint8(response.player);
  writer.writeUint8(cardZoneToNumber(response.zone));
  writer.writeUint8(response.sequence);

  return writer.toArray();
};

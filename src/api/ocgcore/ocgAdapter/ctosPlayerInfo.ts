import { ygopro } from "../idl/ocgcore";
import { ygoProPacket } from "./packet";
import { CTOS_PLAYER_INFO } from "./protoDecl";

export default class CtosPlayerInfoPacket extends ygoProPacket {
  constructor(pb: ygopro.YgoCtosMsg) {
    const encoder = new TextEncoder();

    const player = pb.ctos_player_info.name;
    const exData = encoder.encode(player);

    super(exData.length + 1, CTOS_PLAYER_INFO, exData);
  }
}

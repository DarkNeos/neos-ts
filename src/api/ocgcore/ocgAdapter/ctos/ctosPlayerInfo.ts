import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket } from "../packet";
import { CTOS_PLAYER_INFO } from "../protoDecl";
import { strEncodeUTF16 } from "../util";

export default class CtosPlayerInfoPacket extends ygoProPacket {
  constructor(pb: ygopro.YgoCtosMsg) {
    const player = pb.ctos_player_info.name;
    const exData = strEncodeUTF16(player);

    super(exData.length + 1, CTOS_PLAYER_INFO, exData);
  }
}

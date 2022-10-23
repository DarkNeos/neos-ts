import { ygopro } from "../idl/ocgcore";
import { ygoProPacket } from "./packet";

const CtosPlayerInfo = 16;

export class playerInfoPacket extends ygoProPacket {
  constructor(pb: ygopro.YgoCtosMsg) {
    const encoder = new TextEncoder();

    const player = pb.ctos_player_info.name;
    const exData = encoder.encode(player);

    super(exData.length + 1, CtosPlayerInfo, exData);
  }
}

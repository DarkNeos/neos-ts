import { ygopro } from "../../idl/ocgcore";
import { YgoProPacket } from "../packet";
import { CTOS_PLAYER_INFO } from "../protoDecl";
import { strEncodeUTF16 } from "../util";

/*
 * CTOS PlayerInfo
 *
 * @param player: [unsigned short; 20] - 玩家昵称
 *
 * @usage - 告诉ygopro服务端当前玩家的昵称
 * */
export default class CtosPlayerInfoPacket extends YgoProPacket {
  constructor(pb: ygopro.YgoCtosMsg) {
    const player = pb.ctos_player_info.name;
    const exData = strEncodeUTF16(player);

    super(exData.length + 1, CTOS_PLAYER_INFO, exData);
  }
}

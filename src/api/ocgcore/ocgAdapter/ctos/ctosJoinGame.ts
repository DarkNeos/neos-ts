import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket } from "../packet";
import { CTOS_JOIN_GAME } from "../protoDecl";
import { strEncodeUTF16 } from "../util";

export default class CtosJoinGamePacket extends ygoProPacket {
  constructor(pb: ygopro.YgoCtosMsg) {
    const joinGame = pb.ctos_join_game;

    const version = joinGame.version;
    const gameId = joinGame.gameid;
    const passWd = strEncodeUTF16(joinGame.passwd);

    const exDataLen = 4 + 4 + passWd.length;
    const exData = new Uint8Array(exDataLen);
    const dataView = new DataView(exData.buffer);

    dataView.setUint8(0, version & 0xff);
    dataView.setUint8(1, (version >> 8) & 0xff);
    dataView.setUint8(2, 0);
    dataView.setUint8(3, 0);
    dataView.setUint8(4, gameId & 0xff);
    dataView.setUint8(5, (gameId >> 8) & 0xff);
    dataView.setUint8(6, (gameId >> 16) & 0xff);
    dataView.setUint8(7, (gameId >> 32) & 0xff);
    exData.set(passWd, 8);

    super(exData.length + 1, CTOS_JOIN_GAME, exData);
  }
}

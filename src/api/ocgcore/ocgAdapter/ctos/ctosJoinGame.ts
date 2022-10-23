import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket } from "../packet";
import { CTOS_JOIN_GAME } from "../protoDecl";
import { strEncodeUTF16 } from "../util";

const littleEndian: boolean = true;

export default class CtosJoinGamePacket extends ygoProPacket {
  constructor(pb: ygopro.YgoCtosMsg) {
    const joinGame = pb.ctos_join_game;

    const version = joinGame.version;
    const gameId = joinGame.gameid;
    const passWd = strEncodeUTF16(joinGame.passwd);

    const exDataLen = 2 + 4 + passWd.length;
    const exData = new Uint8Array(exDataLen);
    const dataView = new DataView(exData.buffer);

    dataView.setUint16(0, version, littleEndian);
    dataView.setUint8(2, gameId & 0xff);
    dataView.setUint8(3, (gameId >> 8) & 0xff);
    dataView.setUint8(4, (gameId >> 16) & 0xff);
    dataView.setUint8(5, (gameId >> 32) & 0xff);
    exData.slice(6, exDataLen).set(passWd);

    super(exData.length + 1, CTOS_JOIN_GAME, exData);
  }
}

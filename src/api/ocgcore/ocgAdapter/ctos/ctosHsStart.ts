import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket } from "../packet";
import { CTOS_HS_START } from "../protoDecl";

/*
 * CTOS HsStart
 *
 * @usage - 开始游戏对局
 * */
export default class CtosHsStartPacket extends ygoProPacket {
  constructor(_: ygopro.YgoCtosMsg) {
    super(1, CTOS_HS_START, new Uint8Array(0));
  }
}

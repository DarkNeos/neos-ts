import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket } from "../packet";
import { CTOS_HS_READY } from "../protoDecl";

/*
 * CTOS HsReady
 *
 * @usage - 告诉ygopro服务端当前玩家准备完毕
 * */
export default class CtosHsReady extends ygoProPacket {
  constructor(_: ygopro.YgoCtosMsg) {
    super(1, CTOS_HS_READY, new Uint8Array(0));
  }
}

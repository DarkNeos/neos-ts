import { ygopro } from "../../idl/ocgcore";
import { YgoProPacket } from "../packet";
import { CTOS_HS_NOT_READY } from "../protoDecl";

/*
 * CTOS HsReady
 *
 * @usage - 告诉ygopro服务端当前玩家取消准备
 * */
export default class CtosHsNotReady extends YgoProPacket {
  constructor(_: ygopro.YgoCtosMsg) {
    super(1, CTOS_HS_NOT_READY, new Uint8Array(0));
  }
}

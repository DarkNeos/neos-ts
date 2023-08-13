import { ygopro } from "../../idl/ocgcore";
import { YgoProPacket } from "../packet";
import { CTOS_HS_TO_OBSERVER } from "../protoDecl";

/*
 * CTOS HsReady
 *
 * @usage - 告诉ygopro服务端当前玩家进入观战者行列
 * */
export default class CtosHsToObserver extends YgoProPacket {
  constructor(_: ygopro.YgoCtosMsg) {
    super(1, CTOS_HS_TO_OBSERVER, new Uint8Array(0));
  }
}

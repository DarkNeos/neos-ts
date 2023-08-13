import { ygopro } from "../../idl/ocgcore";
import { YgoProPacket } from "../packet";
import { CTOS_HS_TO_DUEL_LIST } from "../protoDecl";

/*
 * CTOS HsReady
 *
 * @usage - 告诉ygopro服务端当前玩家进入决斗者行列
 * */
export default class CtosHsToDuelList extends YgoProPacket {
  constructor(_: ygopro.YgoCtosMsg) {
    super(1, CTOS_HS_TO_DUEL_LIST, new Uint8Array(0));
  }
}

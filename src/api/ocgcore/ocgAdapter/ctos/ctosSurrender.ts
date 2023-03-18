import { ygopro } from "../../idl/ocgcore";
import { YgoProPacket } from "../packet";
import { CTOS_SURRENDER } from "../protoDecl";

/*
 * CTOS SURRENDER
 *
 * @param - null
 *
 * @usage - 告知服务端当前玩家投降
 *
 * */
export default class CtosSurrender extends YgoProPacket {
  constructor(_: ygopro.YgoCtosMsg) {
    super(1, CTOS_SURRENDER, new Uint8Array(0));
  }
}

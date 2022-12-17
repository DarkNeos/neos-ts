import { ygopro } from "../../idl/ocgcore";
import { YgoProPacket } from "../packet";
import { CTOS_TIME_CONFIRM } from "../protoDecl";

/*
 * CTOS CTOS_TIME_CONFIRM
 *
 * @param - null
 *
 * @usage - 确认计时？
 *
 * */
export default class CtosTimeConfirm extends YgoProPacket {
  constructor(_: ygopro.YgoCtosMsg) {
    super(1, CTOS_TIME_CONFIRM, new Uint8Array(0));
  }
}

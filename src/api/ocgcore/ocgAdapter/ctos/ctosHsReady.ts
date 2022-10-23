import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket } from "../packet";
import { CTOS_HS_READY } from "../protoDecl";

export default class CtosHsReady extends ygoProPacket {
  constructor(_: ygopro.YgoCtosMsg) {
    super(1, CTOS_HS_READY, new Uint8Array(0));
  }
}

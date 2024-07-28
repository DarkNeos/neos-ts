import { ygopro } from "../../idl/ocgcore";
import { YgoProPacket } from "../packet";
import { CTOS_CHAT } from "../protoDecl";
import { strEncodeUTF16Fixed } from "../util";

/*
 * CTOS Chat
 *
 * @param message - 玩家发送的消息
 *
 * @usage - TODO*/
export default class CtosChat extends YgoProPacket {
  constructor(pb: ygopro.YgoCtosMsg) {
    const message = pb.ctos_chat.message;
    const exData = strEncodeUTF16Fixed(message);

    super(exData.length + 1, CTOS_CHAT, exData);
  }
}

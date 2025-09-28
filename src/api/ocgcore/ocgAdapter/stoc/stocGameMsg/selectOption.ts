import { BufferReader } from "@/infra";

import { ygopro } from "../../../idl/ocgcore";
import MsgSelectOption = ygopro.StocGameMessage.MsgSelectOption;

/*
 * Msg Select Option
 *
 * @param - see: https://code.mycard.moe/mycard/neos-protobuf/-/blob/main/idl/ocgcore.neos-protobuf
 * @usage - 玩家选择选项
 *
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReader(data);

  const player = reader.readUint8();
  const count = reader.readUint8();

  const msg = new MsgSelectOption({
    player,
    options: [],
  });

  for (let i = 0; i < count; i++) {
    const option = new MsgSelectOption.Option({
      code: reader.readUint32(),
      response: i,
    });

    msg.options.push(option);
  }

  return msg;
};

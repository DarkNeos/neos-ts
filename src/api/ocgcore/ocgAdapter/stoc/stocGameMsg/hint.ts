import { BufferReader } from "@/infra";

import { ygopro } from "../../../idl/ocgcore";

/*
 * Msg Hint
 *
 * @param hintType: char - 提示的类型
 * @param hintPlayer: char - 提示的玩家
 * @param hintData: int32 - 提示的数据
 *
 * @usage - 显示提示信息
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReader(data);

  const hintCommand = reader.readUint8();
  const hintPlayer = reader.readUint8();
  const hintData = reader.readInt32();

  let hintType = ygopro.StocGameMessage.MsgHint.HintType.UNKNOWN;
  switch (hintCommand) {
    case 0x01: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.HINT_EVENT;

      break;
    }
    case 0x02: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.HINT_MESSAGE;

      break;
    }
    case 0x03: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.HINT_SELECTMSG;

      break;
    }
    case 0x04: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.HINT_OPSELECTED;

      break;
    }
    case 0x05: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.HINT_EFFECT;

      break;
    }
    case 0x06: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.HINT_RACE;

      break;
    }
    case 0x07: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.HINT_ATTRIB;

      break;
    }
    case 0x08: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.HINT_CODE;

      break;
    }
    case 0x09: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.HINT_NUMBER;

      break;
    }
    case 0x0a: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.HINT_CARD;

      break;
    }
    case 0x0b: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.HINT_ZONE;

      break;
    }
    default: {
      break;
    }
  }

  return new ygopro.StocGameMessage.MsgHint({
    hint_type: hintType,
    player: hintPlayer,
    hint_data: hintData,
  });
};

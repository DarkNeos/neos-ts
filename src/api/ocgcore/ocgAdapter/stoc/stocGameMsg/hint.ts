import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "../../bufferIO";

const LITTLE_ENDIAN = true;

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
  const reader = new BufferReader(data, LITTLE_ENDIAN);

  const hintCommand = reader.readUint8();
  const hintPlayer = reader.readUint8();
  const hintData = reader.readInt32();

  let hintType = ygopro.StocGameMessage.MsgHint.HintType.UNKNOWN;
  switch (hintCommand) {
    case 0x01: {
      // TODO

      break;
    }
    case 0x02: {
      // TODO

      break;
    }
    case 0x03: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.SELECT_LOCATION;

      break;
    }
    case 0x04: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.SELECT_EFFECT;

      break;
    }
    case 0x05: {
      // TODO

      break;
    }
    case 0x06: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.SELECT_RACE;

      break;
    }
    case 0x07: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.SELECT_ATTRIBUTE;

      break;
    }
    case 0x08: {
      // TODO

      break;
    }
    case 0x09: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.SELECT_NUMBER;

      break;
    }
    case 0x0a: {
      // TODO

      break;
    }
    case 0x0b: {
      hintType = ygopro.StocGameMessage.MsgHint.HintType.SELECT_REGION;

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

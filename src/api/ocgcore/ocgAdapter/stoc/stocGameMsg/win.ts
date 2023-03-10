import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "../../bufferIO";
import MsgWin = ygopro.StocGameMessage.MsgWin;

/*
 * Msg Win
 *
 * @param player - 玩家编号
 * @param winType - 结果类型
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReader(data, true);

  const player = reader.readUint8();
  const winType = reader.readUint8();

  const type_ =
    player == 0 || winType == 4
      ? MsgWin.ActionType.Win
      : player == 1
      ? MsgWin.ActionType.Defeated
      : MsgWin.ActionType.UNKNOWN;

  return new MsgWin({
    player,
    type_,
  });
};

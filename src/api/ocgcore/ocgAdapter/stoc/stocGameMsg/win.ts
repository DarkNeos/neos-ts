import { BufferReader } from "@/infra";

import { ygopro } from "../../../idl/ocgcore";
import MsgWin = ygopro.StocGameMessage.MsgWin;

/*
 * Msg Win
 *
 * @param player - 玩家编号
 * @param winType - 结果类型
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReader(data);

  const win_player = reader.readUint8();
  const reason = reader.readUint8();

  return new MsgWin({
    win_player,
    reason,
  });
};

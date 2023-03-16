import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import MsgSelectBattleCmd = ygopro.StocGameMessage.MsgSelectBattleCmd;

/*
 * Msg Select Battle Command
 *
 * @param - see: https://code.mycard.moe/mycard/neos-protobuf/-/blob/main/idl/ocgcore.proto
 *
 * @usage - 玩家在战斗阶段可选择的操作
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const msg = new MsgSelectBattleCmd({});
  msg.player = reader.inner.readUint8();

  // 可发动效果
  const activateCmd = new MsgSelectBattleCmd.BattleCmd({
    battle_type: MsgSelectBattleCmd.BattleCmd.BattleType.ACTIVATE,
    battle_datas: [],
  });
  const activateCount = reader.inner.readUint8();
  for (let i = 0; i < activateCount; i++) {
    const cardInfo = reader.readCardInfo();
    const effectDescription = reader.inner.readUint32();
    const activateData = new MsgSelectBattleCmd.BattleCmd.BattleData({
      card_info: cardInfo,
      effect_description: effectDescription,
      response: (i << 16) + 0,
    });
    activateCmd.battle_datas.push(activateData);
  }

  // 可攻击
  const attackCmd = new MsgSelectBattleCmd.BattleCmd({
    battle_type: MsgSelectBattleCmd.BattleCmd.BattleType.ATTACK,
    battle_datas: [],
  });
  const attackCount = reader.inner.readUint8();
  for (let i = 0; i < attackCount; i++) {
    const cardInfo = reader.readCardInfo();
    const directAttackAble = reader.inner.readUint8();
    const attackData = new MsgSelectBattleCmd.BattleCmd.BattleData({
      card_info: cardInfo,
      direct_attackable: directAttackAble == 1,
      response: (i << 16) + 1,
    });
    attackCmd.battle_datas.push(attackData);
  }

  msg.battle_cmds = [activateCmd, attackCmd];

  // 是否可进入M2阶段
  msg.enable_m2 = reader.inner.readUint8() == 1;
  //时是否可结束回合
  msg.enable_ep = reader.inner.readUint8() == 1;

  return msg;
};

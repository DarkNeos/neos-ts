import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "../../bufferIO";
import MsgSelectIdleCmd = ygopro.StocGameMessage.MsgSelectIdleCmd;

const LITTLE_ENDIAN = true;

/*
 * Msg Select Idle Command
 *
 * @param - see: https://code.mycard.moe/mycard/neos-protobuf/-/blob/main/idl/ocgcore.proto#L258
 *
 * @usage - 玩家可选择的操作
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReader(data, LITTLE_ENDIAN);

  const msg = new MsgSelectIdleCmd({});
  msg.player = reader.readUint8();

  // summon
  const summonCmd = new MsgSelectIdleCmd.IdleCmd({
    idle_type: MsgSelectIdleCmd.IdleCmd.IdleType.SUMMON,
    idle_datas: [],
  });
  const summonCount = reader.readUint8();
  for (let i = 0; i < summonCount; i++) {
    const idleData = new MsgSelectIdleCmd.IdleCmd.IdleData({
      card_info: reader.readCardInfo(),
    });
    summonCmd.idle_datas.push(idleData);
  }

  // spsummon
  const spSummonCmd = new MsgSelectIdleCmd.IdleCmd({
    idle_type: MsgSelectIdleCmd.IdleCmd.IdleType.SPSUMMON,
    idle_datas: [],
  });
  const spSummonCount = reader.readUint8();
  for (let i = 0; i < spSummonCount; i++) {
    const idleData = new MsgSelectIdleCmd.IdleCmd.IdleData({
      card_info: reader.readCardInfo(),
    });
    spSummonCmd.idle_datas.push(idleData);
  }

  // pos change
  const posChangeCmd = new MsgSelectIdleCmd.IdleCmd({
    idle_type: MsgSelectIdleCmd.IdleCmd.IdleType.POS_CHANGE,
    idle_datas: [],
  });
  const posChangeCount = reader.readUint8();
  for (let i = 0; i < posChangeCount; i++) {
    const idleData = new MsgSelectIdleCmd.IdleCmd.IdleData({
      card_info: reader.readCardInfo(),
    });
    posChangeCmd.idle_datas.push(idleData);
  }

  // mset
  const mSetCmd = new MsgSelectIdleCmd.IdleCmd({
    idle_type: MsgSelectIdleCmd.IdleCmd.IdleType.MSET,
    idle_datas: [],
  });
  const mSetCount = reader.readUint8();
  for (let i = 0; i < mSetCount; i++) {
    const idleData = new MsgSelectIdleCmd.IdleCmd.IdleData({
      card_info: reader.readCardInfo(),
    });
    mSetCmd.idle_datas.push(idleData);
  }

  // sset
  const sSetCmd = new MsgSelectIdleCmd.IdleCmd({
    idle_type: MsgSelectIdleCmd.IdleCmd.IdleType.SSET,
    idle_datas: [],
  });
  const sSetCount = reader.readUint8();
  for (let i = 0; i < sSetCount; i++) {
    const idleData = new MsgSelectIdleCmd.IdleCmd.IdleData({
      card_info: reader.readCardInfo(),
    });
    sSetCmd.idle_datas.push(idleData);
  }

  // activate
  const activateCmd = new MsgSelectIdleCmd.IdleCmd({
    idle_type: MsgSelectIdleCmd.IdleCmd.IdleType.ACTIVATE,
    idle_datas: [],
  });
  const activateCount = reader.readUint8();
  for (let i = 0; i < activateCount; i++) {
    const idleData = new MsgSelectIdleCmd.IdleCmd.IdleData({
      card_info: reader.readCardInfo(),
      effect_description: reader.readUint32(),
    });
    activateCmd.idle_datas.push(idleData);
  }

  msg.idle_cmds = [
    summonCmd,
    spSummonCmd,
    posChangeCmd,
    mSetCmd,
    sSetCmd,
    activateCmd,
  ];

  msg.enable_bp = reader.readUint8() === 1;
  msg.enable_ep = reader.readUint8() === 1;
  msg.enable_shuffle = reader.readUint8() === 1;

  return msg;
};

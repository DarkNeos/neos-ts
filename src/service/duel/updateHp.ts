import { ygopro } from "@/api";
import { fetchEsHintMeta, matStore } from "@/stores";

import MsgUpdateHp = ygopro.StocGameMessage.MsgUpdateHp;
import { AudioActionType, changeScene, playEffect } from "@/infra/audio";

export default (msgUpdateHp: MsgUpdateHp) => {
  if (msgUpdateHp.type_ === MsgUpdateHp.ActionType.DAMAGE) {
    playEffect(AudioActionType.SOUND_DAMAGE);
    fetchEsHintMeta({ originMsg: "玩家收到伤害时" }); // TODO: i18n
    matStore.initInfo.of(msgUpdateHp.player).life -= msgUpdateHp.value;
  } else if (msgUpdateHp.type_ === MsgUpdateHp.ActionType.RECOVER) {
    playEffect(AudioActionType.SOUND_RECOVER);
    fetchEsHintMeta({ originMsg: "玩家生命值回复时" }); // TODO: i18n
    matStore.initInfo.of(msgUpdateHp.player).life += msgUpdateHp.value;
  }
  if (matStore.initInfo.me.life > matStore.initInfo.op.life * 2) {
    changeScene(AudioActionType.BGM_ADVANTAGE);
  }
  if (matStore.initInfo.me.life * 2 < matStore.initInfo.op.life) {
    changeScene(AudioActionType.BGM_DISADVANTAGE);
  }
};

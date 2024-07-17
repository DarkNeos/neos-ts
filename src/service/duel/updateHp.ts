import { ygopro } from "@/api";

import MsgUpdateHp = ygopro.StocGameMessage.MsgUpdateHp;
import { Container } from "@/container";
import { AudioActionType, changeScene, playEffect } from "@/infra/audio";

import { fetchEsHintMeta } from "./util";

export default (container: Container, msgUpdateHp: MsgUpdateHp) => {
  const context = container.context;
  if (msgUpdateHp.type_ === MsgUpdateHp.ActionType.DAMAGE) {
    playEffect(AudioActionType.SOUND_DAMAGE);
    fetchEsHintMeta({ context, originMsg: "玩家收到伤害时" }); // TODO: i18n
    context.matStore.initInfo.of(msgUpdateHp.player).life -= msgUpdateHp.value;
  } else if (msgUpdateHp.type_ === MsgUpdateHp.ActionType.RECOVER) {
    playEffect(AudioActionType.SOUND_RECOVER);
    fetchEsHintMeta({ context, originMsg: "玩家生命值回复时" }); // TODO: i18n
    context.matStore.initInfo.of(msgUpdateHp.player).life += msgUpdateHp.value;
  }
  if (
    context.matStore.initInfo.me.life >
    context.matStore.initInfo.op.life * 2
  ) {
    changeScene(AudioActionType.BGM_ADVANTAGE);
  }
  if (
    context.matStore.initInfo.me.life * 2 <
    context.matStore.initInfo.op.life
  ) {
    changeScene(AudioActionType.BGM_DISADVANTAGE);
  }
};

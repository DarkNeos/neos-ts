import { ygopro } from "@/api";
import { fetchEsHintMeta, matStore } from "@/stores";

import MsgUpdateHp = ygopro.StocGameMessage.MsgUpdateHp;

export default (msgUpdateHp: MsgUpdateHp) => {
  if (msgUpdateHp.type_ == MsgUpdateHp.ActionType.DAMAGE) {
    fetchEsHintMeta({ originMsg: "玩家收到伤害时" }); // TODO: i18n
    matStore.initInfo.of(msgUpdateHp.player).life -= msgUpdateHp.value;
  } else if (msgUpdateHp.type_ == MsgUpdateHp.ActionType.RECOVER) {
    fetchEsHintMeta({ originMsg: "玩家生命值回复时" }); // TODO: i18n
    matStore.initInfo.of(msgUpdateHp.player).life += msgUpdateHp.value;
  }
};

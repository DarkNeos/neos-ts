import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { updateHp } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import MsgUpdateHp = ygopro.StocGameMessage.MsgUpdateHp;

export default (msgUpdateHp: MsgUpdateHp, dispatch: AppDispatch) => {
  if (msgUpdateHp.type_ == MsgUpdateHp.ActionType.DAMAGE) {
    dispatch(fetchEsHintMeta({ originMsg: "玩家收到伤害时" })); // TODO: i18n
  } else if (msgUpdateHp.type_ == MsgUpdateHp.ActionType.RECOVER) {
    dispatch(fetchEsHintMeta({ originMsg: "玩家生命值回复时" })); // TODO: i18n
  }

  dispatch(updateHp(msgUpdateHp));
};

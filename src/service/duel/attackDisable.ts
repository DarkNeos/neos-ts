import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import { matStore } from "@/valtioStores";

export default (
  _: ygopro.StocGameMessage.MsgAttackDisabled,
  dispatch: AppDispatch
) => {
  dispatch(fetchEsHintMeta({ originMsg: "攻击被无效时" }));
  matStore.hint.fetchEsHintMeta({ originMsg: "攻击被无效时" });
};

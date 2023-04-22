import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import {
  fetchEsHintMeta as FIXME_fetchEsHintMeta,
  matStore,
} from "@/valtioStores";

export default (
  _: ygopro.StocGameMessage.MsgAttackDisabled,
  dispatch: AppDispatch
) => {
  dispatch(fetchEsHintMeta({ originMsg: "攻击被无效时" }));
  FIXME_fetchEsHintMeta({ originMsg: "攻击被无效时" });
};

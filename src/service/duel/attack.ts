import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import { matStore } from "@/valtioStores";

export default (
  attack: ygopro.StocGameMessage.MsgAttack,
  dispatch: AppDispatch
) => {
  dispatch(
    fetchEsHintMeta({ originMsg: "「[?]」攻击时", location: attack.location })
  );
  matStore.hint.fetchEsHintMeta({
    originMsg: "「[?]」攻击时",
    location: attack.location,
  });
};

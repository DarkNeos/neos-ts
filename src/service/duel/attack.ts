import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import { fetchEsHintMeta as FIXME_fetchEsHintMeta } from "@/valtioStores";

export default (
  attack: ygopro.StocGameMessage.MsgAttack,
  dispatch: AppDispatch
) => {
  // dispatch(
  //   fetchEsHintMeta({ originMsg: "「[?]」攻击时", location: attack.location })
  // );
  FIXME_fetchEsHintMeta({
    originMsg: "「[?]」攻击时",
    location: attack.location,
  });
};

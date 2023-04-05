import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { fetchEsHintMeta } from "../../reducers/duel/hintSlice";
import { AppDispatch } from "../../store";

export default (
  attack: ygopro.StocGameMessage.MsgAttack,
  dispatch: AppDispatch
) => {
  dispatch(
    fetchEsHintMeta({ originMsg: "「[?]」攻击时", location: attack.location })
  );
};

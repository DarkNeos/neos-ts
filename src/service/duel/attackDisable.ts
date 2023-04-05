import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { fetchEsHintMeta } from "../../reducers/duel/hintSlice";
import { AppDispatch } from "../../store";

export default (
  _: ygopro.StocGameMessage.MsgAttackDisabled,
  dispatch: AppDispatch
) => {
  dispatch(fetchEsHintMeta({ originMsg: "攻击被无效时" }));
};

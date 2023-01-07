import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgSelectEffectYn = ygopro.StocGameMessage.MsgSelectEffectYn;

export default (selectEffectYn: MsgSelectEffectYn, dispatch: AppDispatch) => {
  console.log(selectEffectYn);
};

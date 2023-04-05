import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { fetchEsHintMeta } from "../../reducers/duel/hintSlice";
import { AppDispatch } from "../../store";

export default (
  chaining: ygopro.StocGameMessage.MsgChaining,
  dispatch: AppDispatch
) => {
  dispatch(
    fetchEsHintMeta({ originMsg: "「[?]」被发动时", cardID: chaining.code })
  );
};

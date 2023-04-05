import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import {
  fetchCommonHintMeta,
  fetchSelectHintMeta,
} from "../../reducers/duel/hintSlice";
import MsgHint = ygopro.StocGameMessage.MsgHint;

export default (hint: MsgHint, dispatch: AppDispatch) => {
  switch (hint.hint_type) {
    case MsgHint.HintType.HINT_EVENT:
    case MsgHint.HintType.HINT_MESSAGE: {
      dispatch(fetchCommonHintMeta(hint.hint_data));
      break;
    }
    case MsgHint.HintType.HINT_SELECTMSG: {
      dispatch(fetchSelectHintMeta({ selectHintData: hint.hint_data }));
      break;
    }
    default: {
      console.log(`Unhandled hint type ${MsgHint.HintType[hint.hint_type]}`);
    }
  }
};

import { ygopro } from "@/api";
import {
  fetchCommonHintMeta,
  fetchEsHintMeta,
  fetchSelectHintMeta,
} from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import {
  fetchCommonHintMeta as FIXME_fetchCommonHintMeta,
  fetchEsHintMeta as FIXME_fetchEsHintMeta,
  fetchSelectHintMeta as FIXME_fetchSelectHintMeta,
} from "@/valtioStores";

import MsgHint = ygopro.StocGameMessage.MsgHint;

export default (hint: MsgHint, dispatch: AppDispatch) => {
  switch (hint.hint_type) {
    case MsgHint.HintType.HINT_EVENT: {
      dispatch(fetchEsHintMeta({ originMsg: hint.hint_data }));
      FIXME_fetchEsHintMeta({ originMsg: hint.hint_data });
      break;
    }
    case MsgHint.HintType.HINT_MESSAGE: {
      dispatch(fetchCommonHintMeta(hint.hint_data));
      FIXME_fetchCommonHintMeta(hint.hint_data);
      break;
    }
    case MsgHint.HintType.HINT_SELECTMSG: {
      dispatch(
        fetchSelectHintMeta({ selectHintData: hint.hint_data, esHint: "" })
      );
      FIXME_fetchSelectHintMeta({
        selectHintData: hint.hint_data,
        esHint: "",
      });
      break;
    }
    default: {
      console.log(`Unhandled hint type ${MsgHint.HintType[hint.hint_type]}`);
    }
  }
};

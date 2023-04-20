import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import {
  fetchCommonHintMeta,
  fetchEsHintMeta,
  fetchSelectHintMeta,
} from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";

import { matStore } from "@/valtioStores";

import MsgHint = ygopro.StocGameMessage.MsgHint;

export default (hint: MsgHint, dispatch: AppDispatch) => {
  switch (hint.hint_type) {
    case MsgHint.HintType.HINT_EVENT: {
      dispatch(fetchEsHintMeta({ originMsg: hint.hint_data }));
      matStore.hint.fetchEsHintMeta({ originMsg: hint.hint_data });
      break;
    }
    case MsgHint.HintType.HINT_MESSAGE: {
      dispatch(fetchCommonHintMeta(hint.hint_data));
      matStore.hint.fetchCommonHintMeta(hint.hint_data);
      break;
    }
    case MsgHint.HintType.HINT_SELECTMSG: {
      dispatch(
        fetchSelectHintMeta({ selectHintData: hint.hint_data, esHint: "" })
      );
      matStore.hint.fetchSelectHintMeta({
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

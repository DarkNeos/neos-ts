import { ygopro } from "@/api";
import {
  fetchCommonHintMeta,
  fetchEsHintMeta,
  fetchSelectHintMeta,
} from "@/stores";

import MsgHint = ygopro.StocGameMessage.MsgHint;

export default async (hint: MsgHint) => {
  switch (hint.hint_type) {
    case MsgHint.HintType.HINT_EVENT: {
      await fetchEsHintMeta({ originMsg: hint.hint_data });
      break;
    }
    case MsgHint.HintType.HINT_MESSAGE: {
      fetchCommonHintMeta(hint.hint_data);
      break;
    }
    case MsgHint.HintType.HINT_SELECTMSG: {
      fetchSelectHintMeta({
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

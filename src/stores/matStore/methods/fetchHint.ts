import { Region } from "@/api";
import { DESCRIPTION_LIMIT, fetchStrings, getStrings } from "@/api";
import { fetchCard } from "@/api/cards";

import { matStore } from "../store";

export const fetchCommonHintMeta = (code: number) => {
  matStore.hint.code = code;
  matStore.hint.msg = fetchStrings(Region.System, code);
};

export const fetchSelectHintMeta = ({
  selectHintData,
  esHint,
}: {
  selectHintData: number;
  esHint?: string;
}) => {
  let selectHintMeta = "";
  if (selectHintData > DESCRIPTION_LIMIT) {
    // 针对`MSG_SELECT_PLACE`的特化逻辑
    const cardMeta = fetchCard(selectHintData);
    selectHintMeta = fetchStrings(Region.System, 569).replace(
      "[%ls]",
      cardMeta.text.name || "[?]",
    );
  } else {
    selectHintMeta = getStrings(selectHintData);
  }

  matStore.hint.code = selectHintData;
  if (matStore.hint.code > DESCRIPTION_LIMIT) {
    // 针对`MSG_SELECT_PLACE`的特化逻辑
    matStore.hint.msg = selectHintMeta;
  } else {
    matStore.hint.esSelectHint = selectHintMeta;
    matStore.hint.esHint = esHint;
  }
};

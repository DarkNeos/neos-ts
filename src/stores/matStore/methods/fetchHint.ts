import { Region } from "@/api";
import { DESCRIPTION_LIMIT, fetchStrings, getStrings } from "@/api";
import { fetchCard } from "@/api/cards";
import { formatCardName } from "@/api/cardText";

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
    selectHintMeta = formatCardName(
      fetchStrings(Region.System, 569),
      cardMeta.text.name || "?",
      "[%ls]",
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
    // 连锁询问保留服务器给出的当前时点；明确传入空字符串时才清除。
    if (esHint !== undefined) matStore.hint.esHint = esHint;
  }
};

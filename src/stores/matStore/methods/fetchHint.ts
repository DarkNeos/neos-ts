import { Region, type ygopro } from "@/api";
import { DESCRIPTION_LIMIT, fetchStrings, getStrings } from "@/api";
import { fetchCard } from "@/api/cards";
import { cardStore } from "@/stores/cardStore";

import { matStore } from "../store";

export const fetchCommonHintMeta = (code: number) => {
  matStore.hint.code = code;
  matStore.hint.msg = fetchStrings(Region.System, code);
};

export const fetchSelectHintMeta = async ({
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
    selectHintMeta = await getStrings(selectHintData);
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

export const fetchEsHintMeta = async ({
  originMsg,
  location,
  cardID,
}: {
  originMsg: string | number;
  location?: ygopro.CardLocation;
  cardID?: number;
}) => {
  const newOriginMsg =
    typeof originMsg === "string"
      ? originMsg
      : fetchStrings(Region.System, originMsg);

  const cardMeta = cardID ? fetchCard(cardID) : undefined;

  let esHint = newOriginMsg;

  if (cardMeta?.text.name) {
    esHint = esHint.replace("[?]", cardMeta.text.name);
  }

  if (location) {
    const fieldMeta = cardStore.at(
      location.zone,
      location.controller,
      location.sequence,
    );
    if (fieldMeta?.meta.text.name) {
      esHint = esHint.replace("[?]", fieldMeta.meta.text.name);
    }
  }

  matStore.hint.esHint = esHint;
};

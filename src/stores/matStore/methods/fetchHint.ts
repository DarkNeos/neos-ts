import { Region, type ygopro } from "@/api";
import { DESCRIPTION_LIMIT, fetchStrings, getStrings } from "@/api";
import { fetchCard } from "@/api/cards";
import { cardStore } from "@/stores/cardStore";

import { matStore } from "../store";

const { hint } = matStore;

export const fetchCommonHintMeta = (code: number) => {
  hint.code = code;
  hint.msg = fetchStrings(Region.System, code);
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
    const cardMeta = await fetchCard(selectHintData);
    selectHintMeta = fetchStrings(Region.System, 569).replace(
      "[%ls]",
      cardMeta.text.name || "[?]"
    );
  } else {
    selectHintMeta = await getStrings(selectHintData);
  }

  hint.code = selectHintData;
  if (hint.code > DESCRIPTION_LIMIT) {
    // 针对`MSG_SELECT_PLACE`的特化逻辑
    hint.msg = selectHintMeta;
  } else {
    hint.esSelectHint = selectHintMeta;
    hint.esHint = esHint;
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

  const cardMeta = cardID ? await fetchCard(cardID) : undefined;

  let esHint = newOriginMsg;

  if (cardMeta?.text.name) {
    esHint = esHint.replace("[?]", cardMeta.text.name);
  }

  if (location) {
    const fieldMeta = cardStore.at(
      location.zone,
      location.controller,
      location.sequence
    );
    if (fieldMeta?.meta.text.name) {
      esHint = esHint.replace("[?]", fieldMeta.meta.text.name);
    }
  }

  hint.esHint = esHint;
};

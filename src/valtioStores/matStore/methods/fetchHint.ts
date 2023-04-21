import { matStore } from "@/valtioStores";
import { fetchCard } from "@/api/cards";
import { DESCRIPTION_LIMIT, fetchStrings, getStrings } from "@/api/strings";
import type { ygopro } from "@/api/ocgcore/idl/ocgcore";

const { hint } = matStore;

export const fetchCommonHintMeta = (code: number) => {
  hint.code = code;
  hint.msg = fetchStrings("!system", code);
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
    const cardMeta = await fetchCard(selectHintData, true);
    selectHintMeta = fetchStrings("!system", 569).replace(
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
      : fetchStrings("!system", originMsg);

  const cardMeta = cardID ? await fetchCard(cardID) : undefined;

  let esHint = newOriginMsg;

  if (cardMeta?.text.name) {
    esHint = esHint.replace("[?]", cardMeta.text.name);
  }

  if (location) {
    const fieldMeta = matStore
      .getZone(location.location)
      .at(location.controler)
      .at(location.sequence);
    if (fieldMeta?.occupant?.text.name) {
      esHint = esHint.replace("[?]", fieldMeta.occupant.text.name);
    }
  }

  hint.esHint = esHint;
};

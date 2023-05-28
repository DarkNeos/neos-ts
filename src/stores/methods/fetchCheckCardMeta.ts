import { ygopro } from "@/api";
import { fetchCard, getCardStr } from "@/api/cards";
import { cardStore, messageStore } from "@/stores";

export const fetchCheckCardMeta = async (
  {
    code,
    location,
    level1,
    level2,
    response,
    effectDescCode,
  }: {
    code: number;
    location: ygopro.CardLocation;
    level1?: number;
    level2?: number;
    response: number;
    effectDescCode?: number;
  },
  selected?: boolean,
  mustSelect?: boolean
) => {
  const controller = location.controler;
  const newID =
    code != 0
      ? code
      : cardStore.at(location.location, controller, location.sequence)?.code ||
        0;
  const meta = await fetchCard(newID);

  const effectDesc = effectDescCode
    ? getCardStr(meta, effectDescCode & 0xf)
    : undefined;
  const newOption = {
    meta,
    location: location.toObject(),
    level1,
    level2,
    effectDesc,
    response,
  };

  if (selected) {
    messageStore.selectCardActions.selecteds.push(newOption);
  } else if (mustSelect) {
    messageStore.selectCardActions.mustSelects.push(newOption);
  } else {
    messageStore.selectCardActions.selectables.push(newOption);
  }
};

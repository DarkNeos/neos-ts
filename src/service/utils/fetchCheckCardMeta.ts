import type { ygopro } from "@/api";
import { fetchCard, getCardStr } from "@/api/cards";
import { cardStore } from "@/stores";
import type { Option } from "@/ui/Duel/Message";

const helper = async (
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
  selecteds: Option[],
  mustSelects: Option[],
  selectables: Option[],
  selected?: boolean,
  mustSelect?: boolean
) => {
  const controller = location.controller;
  const newID =
    code != 0
      ? code
      : cardStore.at(location.zone, controller, location.sequence)?.code || 0;
  const meta = await fetchCard(newID);

  const effectDesc = effectDescCode
    ? getCardStr(meta, effectDescCode & 0xf)
    : undefined;
  const newOption: Option = {
    meta,
    location,
    level1,
    level2,
    effectDesc,
    response,
  };

  if (selected) {
    selecteds.push(newOption);
  } else if (mustSelect) {
    mustSelects.push(newOption);
  } else {
    selectables.push(newOption);
  }
};

export const fetchCheckCardMeta = async (
  cards: {
    code: number;
    location: ygopro.CardLocation;
    level1?: number;
    level2?: number;
    response: number;
    effectDescCode?: number;
  }[],
  selected?: boolean,
  mustSelect?: boolean
) => {
  const selecteds: Option[] = [];
  const mustSelects: Option[] = [];
  const selectables: Option[] = [];
  for (const card of cards) {
    await helper(
      card,
      selecteds,
      mustSelects,
      selectables,
      selected,
      mustSelect
    ); // TODO: 研究下改成并行
  }
  return { selecteds, mustSelects, selectables };
};

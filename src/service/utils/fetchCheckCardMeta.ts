import type { ygopro } from "@/api";
import { fetchCard, getCardStr } from "@/api/cards";
import { Context } from "@/container";
import type { Option } from "@/ui/Duel/Message";

const helper = async (
  context: Context,
  {
    code,
    location,
    level1,
    level2,
    response,
    effect_description,
  }: {
    code: number;
    location: ygopro.CardLocation;
    level1?: number;
    level2?: number;
    response: number;
    effect_description?: number;
  },
  selecteds: Option[],
  mustSelects: Option[],
  selectables: Option[],
  selected?: boolean,
  mustSelect?: boolean,
) => {
  const { controller, zone, sequence } = location;
  const target = context.cardStore.at(zone, controller, sequence);

  // 这里可能直接用target.meta即可，不用再查一遍DB
  // 但是ygopro后端传回来了code，感觉这里会有些坑，因此求稳这样写
  const newID =
    code !== 0
      ? code
      : target !== undefined
      ? target.code !== 0
        ? target.code
        : target.meta.id
      : 0;
  const meta = fetchCard(newID);

  const effectDesc = effect_description
    ? getCardStr(meta, effect_description & 0xf)
    : undefined;
  const newOption: Option = {
    meta,
    location,
    level1,
    level2,
    effectDesc,
    response,
    targeted: target?.targeted,
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
  context: Context,
  cards: {
    code: number;
    location: ygopro.CardLocation;
    level1?: number;
    level2?: number;
    response: number;
    effect_description?: number;
  }[],
  selected?: boolean,
  mustSelect?: boolean,
) => {
  const selecteds: Option[] = [];
  const mustSelects: Option[] = [];
  const selectables: Option[] = [];
  for (const card of cards) {
    await helper(
      context,
      card,
      selecteds,
      mustSelects,
      selectables,
      selected,
      mustSelect,
    ); // TODO: 研究下改成并行
  }
  return { selecteds, mustSelects, selectables };
};

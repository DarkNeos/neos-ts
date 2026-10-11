import type { ygopro } from "@/api";
import { fetchCard } from "@/api/cards";
import { getStrings } from "@/api/strings";
import { Context } from "@/container";
import { isCardDisabled } from "@/stores";
import type { CardSelectionOption as Option } from "@/stores/cardSelectionTypes";

const helper = async (
  context: Context,
  {
    code,
    location,
    tributeValue,
    level1,
    level2,
    response,
    effect_description,
  }: {
    code: number;
    location: ygopro.CardLocation;
    tributeValue?: number;
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
  const target = context.cardStore.find(location);

  // 选卡消息的卡号优先于场上缓存；未提供卡号时使用当前已知身份，未知卡保持 0。
  const newID =
    code !== 0
      ? code
      : target !== undefined
      ? target.code !== 0
        ? target.code
        : target.meta.id
      : 0;
  const meta = fetchCard(newID);

  // 完整描述编号包含效果来源卡号；被赋予的效果可能来自另一张卡。
  const effectDesc = effect_description
    ? getStrings(effect_description)
    : undefined;
  const newOption: Option = {
    meta,
    location,
    tributeValue,
    level1,
    level2,
    effectDesc,
    response,
    selected: !!selected,
    targeted: target?.targeted,
    disabled: target ? isCardDisabled(target) : false,
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
    tributeValue?: number;
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

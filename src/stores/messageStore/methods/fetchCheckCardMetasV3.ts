import { fetchCard, type ygopro } from "@/api";
import { getCardByLocation, messageStore } from "@/stores";

export const fetchCheckCardMetasV3 = async ({
  mustSelect,
  options,
}: {
  mustSelect: boolean;
  options: {
    code: number;
    location: ygopro.CardLocation;
    level1: number;
    level2: number;
    response: number;
  }[];
}) => {
  const metas = await Promise.all(
    options.map(async (option) => {
      return await fetchCard(option.code, true);
    })
  );
  const newOptions = options.map((option) => {
    if (option.code == 0) {
      const newCode = getCardByLocation(option.location)?.occupant?.id || 0;
      option.code = newCode;
    }

    return {
      meta: { id: option.code, data: {}, text: {} },
      level1: option.level1,
      level2: option.level2,
      response: option.response,
    };
  });

  newOptions.forEach((option) => {
    metas.forEach((meta) => {
      if (option.meta.id == meta.id) {
        option.meta = meta;
      }
    });
  });

  if (mustSelect) {
    messageStore.checkCardModalV3.mustSelectList = newOptions;
  } else {
    messageStore.checkCardModalV3.selectAbleList = newOptions;
  }
};

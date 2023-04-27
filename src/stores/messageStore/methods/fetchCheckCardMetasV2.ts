import { fetchCard, type ygopro } from "@/api";
import { getCardByLocation, messageStore } from "@/stores";

export const fetchCheckCardMetasV2 = async ({
  selected,
  options,
}: {
  selected: boolean;
  options: {
    code: number;
    location: ygopro.CardLocation;
    response: number;
    name?: string;
    desc?: string;
  }[];
}) => {
  const metas = await Promise.all(
    options.map(async (option) => {
      return await fetchCard(option.code, true);
    })
  );

  for (const option of options) {
    if (option.code == 0) {
      const newCode = getCardByLocation(option.location)?.occupant?.id || 0;
      option.code = newCode;
    }
  }

  options.forEach((option) => {
    metas.forEach((meta) => {
      if (option.code == meta.id) {
        option.name = meta.text.name;
        option.desc = meta.text.desc;
      }
    });
  });

  if (selected) {
    messageStore.checkCardModalV2.selectedOptions = options;
  } else {
    messageStore.checkCardModalV2.selectableOptions = options;
  }
};

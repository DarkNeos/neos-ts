import { fetchStrings, getStrings, Region, type ygopro } from "@/api";
import { displayOptionModal } from "@/ui/Duel/Message";

export default async (selectOption: ygopro.StocGameMessage.MsgSelectOption) => {
  const options = selectOption.options;
  if (options.length === 0) {
    console.warn("<MsgSelectOption>options is empty.");
    return;
  }
  await displayOptionModal(
    fetchStrings(Region.System, 556),
    options.map(({ code, response }) => ({
      info: getStrings(code),
      response,
    })),
    1,
  );
};

import { fetchStrings, getStrings, Region, type ygopro } from "@/api";
import { displayOptionModal } from "@/ui/Duel/Message";

export default async (selectOption: ygopro.StocGameMessage.MsgSelectOption) => {
  const options = selectOption.options;
  await displayOptionModal(
    fetchStrings(Region.System, 556),
    options.map(({ code, response }) => ({
      info: getStrings(code),
      response,
    })),
    1,
  );
};

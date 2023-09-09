import {
  fetchStrings,
  getStrings,
  Region,
  sendSelectOptionResponse,
  type ygopro,
} from "@/api";
import { displayOptionModal } from "@/ui/Duel/Message";

export default async (selectOption: ygopro.StocGameMessage.MsgSelectOption) => {
  const options = selectOption.options;
  if (options.length === 0) {
    sendSelectOptionResponse(0);
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

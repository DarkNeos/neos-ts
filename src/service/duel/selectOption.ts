import {
  fetchCard,
  fetchStrings,
  getCardStr,
  Region,
  type ygopro,
} from "@/api";
import { displayOptionModal } from "@/ui/Duel/Message";

export default async (selectOption: ygopro.StocGameMessage.MsgSelectOption) => {
  const options = selectOption.options;
  await displayOptionModal(
    fetchStrings(Region.System, 556),
    await Promise.all(
      options.map(async ({ code, response }) => {
        const meta = fetchCard(code >> 4);
        const info = getCardStr(meta, code & 0xf) ?? "[?]";
        return { info, response };
      }),
    ),
    1,
  );
};

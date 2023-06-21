import { fetchCard, getCardStr, ygopro } from "@/api";
import MsgSelectOption = ygopro.StocGameMessage.MsgSelectOption;
import { displayOptionModal } from "@/ui/Duel/Message";

export default async (selectOption: MsgSelectOption) => {
  const options = selectOption.options;
  await displayOptionModal(
    await Promise.all(
      options.map(async ({ code, response }) => {
        const meta = await fetchCard(code >> 4);
        const msg = getCardStr(meta, code & 0xf) || "[?]";
        return { msg, response };
      })
    )
  );
};

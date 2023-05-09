import { fetchCard, getCardStr, ygopro } from "@/api";
import MsgSelectOption = ygopro.StocGameMessage.MsgSelectOption;
import { messageStore } from "@/stores";

export default async (selectOption: MsgSelectOption) => {
  const options = selectOption.options;

  await Promise.all(
    options.map(async ({ code, response }) => {
      const meta = await fetchCard(code >> 4);
      const msg = getCardStr(meta, code & 0xf) || "[?]";
      const newResponse = { msg, response };
      messageStore.optionModal.options.push(newResponse);
    })
  );

  messageStore.optionModal.isOpen = true;
};

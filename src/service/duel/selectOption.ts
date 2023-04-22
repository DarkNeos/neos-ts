import { ygopro, fetchCard, getCardStr } from "@/api";
import { setOptionModalIsOpen } from "@/reducers/duel/mod";
import { fetchOptionMeta } from "@/reducers/duel/modal/mod";
import { AppDispatch } from "@/store";
import MsgSelectOption = ygopro.StocGameMessage.MsgSelectOption;
import { messageStore } from "@/valtioStores";

export default async (selectOption: MsgSelectOption, dispatch: AppDispatch) => {
  const player = selectOption.player;
  const options = selectOption.options;

  for (let option of options) {
    dispatch(fetchOptionMeta(option));
  }

  dispatch(setOptionModalIsOpen(true));

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

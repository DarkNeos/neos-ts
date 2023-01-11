import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { setOptionModalIsOpen } from "../../reducers/duel/mod";
import { fetchOptionMeta } from "../../reducers/duel/modal/mod";
import { AppDispatch } from "../../store";
import MsgSelectOption = ygopro.StocGameMessage.MsgSelectOption;

export default (selectOption: MsgSelectOption, dispatch: AppDispatch) => {
  const player = selectOption.player;
  const options = selectOption.options;

  for (let option of options) {
    dispatch(fetchOptionMeta(option));
  }

  dispatch(setOptionModalIsOpen(true));
};

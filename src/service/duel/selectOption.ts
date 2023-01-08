import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgSelectOption = ygopro.StocGameMessage.MsgSelectOption;

export default (selectOption: MsgSelectOption, dispatch: AppDispatch) => {
  console.log(selectOption);
};

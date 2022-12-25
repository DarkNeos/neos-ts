import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgSelectPlace = ygopro.StocGameMessage.MsgSelectPlace;

export default (selectPlace: MsgSelectPlace, dispatch: AppDispatch) => {
  // TODO

  console.log(selectPlace);
};

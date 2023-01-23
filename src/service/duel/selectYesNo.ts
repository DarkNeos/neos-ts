import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgSelectYesNo = ygopro.StocGameMessage.MsgSelectYesNo;

export default (selectYesNo: MsgSelectYesNo, dispatch: AppDispatch) => {
  const player = selectYesNo.player;
  const effect_description = selectYesNo.effect_description;

  console.log(`effect_description: ${effect_description}`);
};

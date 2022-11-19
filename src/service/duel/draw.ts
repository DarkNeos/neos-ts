import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import { meAddHands, opAddHands } from "../../reducers/duel/mod";

export default (
  draw: ygopro.StocGameMessage.MsgDraw,
  dispatch: AppDispatch
) => {
  if (draw.player === 0) {
    dispatch(meAddHands(draw.cards));
  } else if (draw.player === 1) {
    dispatch(opAddHands(draw.cards));
  } else {
    console.log("Currently only support 2v2 mode.");
  }
};

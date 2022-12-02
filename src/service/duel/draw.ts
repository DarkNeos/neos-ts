import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import { addHands } from "../../reducers/duel/mod";
import { fetchMeHandsMeta } from "../../reducers/duel/handsSlice";

export default (
  draw: ygopro.StocGameMessage.MsgDraw,
  dispatch: AppDispatch
) => {
  // FIXME: draw.player 和先后攻有关系
  if (draw.player === 0) {
    dispatch(addHands([0, draw.cards]));
    dispatch(fetchMeHandsMeta(draw.cards));
  } else if (draw.player === 1) {
    dispatch(addHands([1, draw.cards]));
  } else {
    console.log("Currently only support 2v2 mode.");
  }
};

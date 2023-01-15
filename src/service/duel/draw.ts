import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import { fetchHandsMeta } from "../../reducers/duel/handsSlice";

export default (
  draw: ygopro.StocGameMessage.MsgDraw,
  dispatch: AppDispatch
) => {
  dispatch(fetchHandsMeta({ controler: draw.player, codes: draw.cards }));
};

import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import { fetchHandsMeta } from "../../reducers/duel/handsSlice";
import { fetchEsHintMeta } from "../../reducers/duel/hintSlice";

export default (
  draw: ygopro.StocGameMessage.MsgDraw,
  dispatch: AppDispatch
) => {
  dispatch(fetchEsHintMeta({ originMsg: "玩家抽卡时" }));
  dispatch(fetchHandsMeta({ controler: draw.player, codes: draw.cards }));
};

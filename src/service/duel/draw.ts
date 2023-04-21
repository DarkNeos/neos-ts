import { ygopro } from "@/api";
import { fetchHandsMeta } from "@/reducers/duel/handsSlice";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";
import { matStore } from "@/valtioStores";

export default (
  draw: ygopro.StocGameMessage.MsgDraw,
  dispatch: AppDispatch
) => {
  dispatch(fetchEsHintMeta({ originMsg: "玩家抽卡时" }));
  dispatch(fetchHandsMeta({ controler: draw.player, codes: draw.cards }));

  matStore.hint.fetchEsHintMeta({ originMsg: "玩家抽卡时" });
  matStore.hands.add(draw.player, draw.cards);
};

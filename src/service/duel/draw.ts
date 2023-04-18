import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { fetchHandsMeta } from "@/reducers/duel/handsSlice";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { AppDispatch } from "@/store";

import { valtioStore } from "@/valtioStores";

export default (
  draw: ygopro.StocGameMessage.MsgDraw,
  dispatch: AppDispatch
) => {
  dispatch(fetchEsHintMeta({ originMsg: "玩家抽卡时" }));
  dispatch(fetchHandsMeta({ controler: draw.player, codes: draw.cards }));

  const playMat = valtioStore.duelStore.playMat;

  playMat.hands.add(draw.player, draw.cards);
};

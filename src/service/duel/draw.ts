import { ygopro } from "@/api";
import { fetchEsHintMeta, matStore } from "@/stores";

export default (draw: ygopro.StocGameMessage.MsgDraw) => {
  fetchEsHintMeta({ originMsg: "玩家抽卡时" });
  matStore.hands.of(draw.player).add(draw.cards);
};

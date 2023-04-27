import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/stores";

export default (_swap: ygopro.StocGameMessage.MsgSwap) => {
  fetchEsHintMeta({ originMsg: 1602 });
};

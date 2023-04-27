import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/stores";

export default (_: ygopro.StocGameMessage.MsgSpSummoned) => {
  fetchEsHintMeta({ originMsg: 1606 });
};

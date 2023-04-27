import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/stores";

export default (_: ygopro.StocGameMessage.MsgSummoned) => {
  fetchEsHintMeta({ originMsg: 1604 });
};

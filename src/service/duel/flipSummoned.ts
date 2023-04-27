import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/stores";

export default (_: ygopro.StocGameMessage.MsgFlipSummoned) => {
  fetchEsHintMeta({ originMsg: 1608 });
};

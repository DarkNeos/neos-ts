import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/stores";

export default (_set: ygopro.StocGameMessage.MsgSet) => {
  fetchEsHintMeta({ originMsg: 1601 });
};

import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/stores";

export default (_: ygopro.StocGameMessage.MsgAttackDisabled) => {
  fetchEsHintMeta({ originMsg: "攻击被无效时" });
};

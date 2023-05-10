import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/stores";

export default (attack: ygopro.StocGameMessage.MsgAttack) => {
  fetchEsHintMeta({
    originMsg: "「[?]」攻击时",
    location: attack.attacker_location,
  });
};

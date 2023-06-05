import { ygopro } from "@/api";
import { cardStore, fetchEsHintMeta } from "@/stores";

export default async (attack: ygopro.StocGameMessage.MsgAttack) => {
  fetchEsHintMeta({
    originMsg: "「[?]」攻击时",
    location: attack.attacker_location,
  });

  const attacker = cardStore.at(
    attack.attacker_location.zone,
    attack.attacker_location.controller,
    attack.attacker_location.sequence
  );

  if (attacker) {
    if (attack.direct_attack) {
      // TODO: 实现直接攻击的动画
    } else {
      const target = cardStore.at(
        attack.target_location.zone,
        attack.target_location.controller,
        attack.target_location.sequence
      );

      if (target) {
        // TODO: 实现攻击`target`的动画
      } else {
        console.warn(`<Attack>target from ${attack.target_location} is null`);
      }
    }
  } else {
    console.warn(`<Attack>attacker from ${attack.attacker_location} is null`);
  }
};

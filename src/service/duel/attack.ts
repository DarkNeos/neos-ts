import { ygopro } from "@/api";
import { fetchEsHintMeta, matStore } from "@/stores";

export default (attack: ygopro.StocGameMessage.MsgAttack) => {
  fetchEsHintMeta({
    originMsg: "「[?]」攻击时",
    location: attack.attacker_location,
  });

  const attacker = matStore
    .in(attack.attacker_location.location)
    .of(attack.attacker_location.controler)
    .at(attack.attacker_location.sequence);

  if (attacker) {
    if (attack.direct_attack) {
      attacker.directAttack = true;

      setTimeout(() => (attacker.directAttack = false), 500);
    } else {
      const target = matStore
        .in(attack.target_location.location)
        .of(attack.target_location.controler)
        .at(attack.target_location.sequence);

      if (target) {
        attacker.attackTarget = {
          sequence: attack.target_location.sequence,
          opponent: !matStore.isMe(attack.target_location.controler),
          ...target,
        };

        setTimeout(() => (attacker.attackTarget = undefined), 500);
      }
    }
  }
};

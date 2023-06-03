import { ygopro } from "@/api";
import { cardStore, fetchEsHintMeta, matStore } from "@/stores";

export default async (attack: ygopro.StocGameMessage.MsgAttack) => {
  fetchEsHintMeta({
    originMsg: "「[?]」攻击时",
    location: attack.attacker_location,
  });

  const attacker = cardStore.at(
    attack.attacker_location.zone,
    attack.attacker_location.controler,
    attack.attacker_location.sequence
  );

  if (attacker) {
    if (attack.direct_attack) {
      attacker.directAttack = true;

      // await sleep(500);
      attacker.directAttack = false;
    } else {
      const target = cardStore.at(
        attack.target_location.zone,
        attack.target_location.controler,
        attack.target_location.sequence
      );

      if (target) {
        attacker.attackTarget = {
          opponent: !matStore.isMe(attack.target_location.controler),
          ...target,
        };

        // await sleep(500);
        attacker.attackTarget = undefined;
      }
    }
  }
};

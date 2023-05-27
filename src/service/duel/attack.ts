import { ygopro } from "@/api";
import { sleep } from "@/infra";
import { cardStore, fetchEsHintMeta, matStore } from "@/stores";

export default async (attack: ygopro.StocGameMessage.MsgAttack) => {
  fetchEsHintMeta({
    originMsg: "「[?]」攻击时",
    location: attack.attacker_location,
  });

  // const attacker = matStore
  //   .in(attack.attacker_location.location)
  //   .of(attack.attacker_location.controler)
  //   .at(attack.attacker_location.sequence);

  const attacker = cardStore.at(
    attack.attacker_location.location,
    attack.attacker_location.controler,
    attack.attacker_location.sequence
  );

  if (attacker) {
    if (attack.direct_attack) {
      attacker.directAttack = true;

      await sleep(500);
      attacker.directAttack = false;
    } else {
      // const target = matStore
      //   .in(attack.target_location.location)
      //   .of(attack.target_location.controler)
      //   .at(attack.target_location.sequence);

      const target = cardStore.at(
        attack.target_location.location,
        attack.target_location.controler,
        attack.target_location.sequence
      );

      if (target) {
        attacker.attackTarget = {
          sequence: attack.target_location.sequence, // FIXME: 确实会覆盖，代码这样没错吗
          opponent: !matStore.isMe(attack.target_location.controler),
          ...target,
        };

        await sleep(500);
        attacker.attackTarget = undefined;
      }
    }
  }
};

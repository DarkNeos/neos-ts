import { ygopro } from "@/api";
import { eventbus, sleep, Task } from "@/infra";
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
      await eventbus.call(Task.Attack, attacker.uuid, true);
    } else {
      await eventbus.call(
        Task.Attack,
        attacker.uuid,
        false,
        attack.target_location
      );
    }
  } else {
    console.warn(`<Attack>attacker from ${attack.attacker_location} is null`);
  }

  await sleep(1000);
};

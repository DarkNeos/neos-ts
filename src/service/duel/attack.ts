import { ygopro } from "@/api";
import { AudioActionType, playEffect } from "@/infra/audio";
import { cardStore, fetchEsHintMeta } from "@/stores";
import { callCardAttack } from "@/ui/Duel/PlayMat/Card";

export default async (attack: ygopro.StocGameMessage.MsgAttack) => {
  fetchEsHintMeta({
    originMsg: "「[?]」攻击时",
    location: attack.attacker_location,
  });

  const attacker = cardStore.at(
    attack.attacker_location.zone,
    attack.attacker_location.controller,
    attack.attacker_location.sequence,
  );

  if (attacker) {
    if (attack.direct_attack) {
      playEffect(AudioActionType.SOUND_DIRECT_ATTACK);
      await callCardAttack(attacker.uuid, {
        directAttack: true,
      });
    } else {
      playEffect(AudioActionType.SOUND_ATTACK);
      await callCardAttack(attacker.uuid, {
        directAttack: false,
        target: attack.target_location,
      });
    }
  } else {
    console.warn(`<Attack>attacker from ${attack.attacker_location} is null`);
  }
};

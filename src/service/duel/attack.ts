import { ygopro } from "@/api";
import { Container } from "@/container";
import { presentationDelay } from "@/infra/presentationDelay";

import { fetchEsHintMeta } from "./util";

export default async (
  container: Container,
  attack: ygopro.StocGameMessage.MsgAttack,
) => {
  const context = container.context;
  context.matStore.clearAttack();
  fetchEsHintMeta({
    context,
    originMsg: attack.direct_attack ? "[?]直接攻击时" : "[?]攻击时",
    location: attack.attacker_location,
  });

  const attacker = context.cardStore.find(attack.attacker_location);
  const target = attack.direct_attack
    ? undefined
    : context.cardStore.find(attack.target_location);
  if (!attacker || (!attack.direct_attack && !target)) return;
  context.matStore.attackDeclaration = {
    attackerUuid: attacker.uuid,
    targetUuid: target?.uuid,
    directAttack: attack.direct_attack,
  };
  await presentationDelay(200);
};

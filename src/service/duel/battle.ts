import { ygopro } from "@/api";
import type { DuelEvent } from "@/api/ocgcore/ocgAdapter/duelEvent";
import type { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";
import { replayPresentation } from "@/infra/replayPresentation";
import { callCardAttack, callCardHit } from "@/ui/Duel/PlayMat/Card";

export default async function battle(
  container: Container,
  event: Extract<DuelEvent, { kind: "battle" }>,
) {
  const { cardStore, matStore } = container.context;
  const attacker = cardStore.find(event.attacker.location);
  const target = event.defender && cardStore.find(event.defender.location);
  matStore.clearAttack();
  matStore.phase.currentPhase =
    ygopro.StocGameMessage.MsgNewPhase.PhaseType.DAMAGE_GAL;
  // 缺少实体不能解释为直接攻击；直接攻击由协议中的空目标明确指定。
  if (!attacker || (event.defender && !target) || container.conn.cancelled)
    return;
  for (const [card, stats] of [
    [attacker, event.attacker],
    [target, event.defender],
  ] as const) {
    if (!card || !stats) continue;
    card.meta.data.atk = stats.attack;
    card.meta.data.def = stats.defense;
  }
  if (replayPresentation.seeking) return;

  const declaration = {
    attackerUuid: attacker.uuid,
    targetUuid: target?.uuid,
    directAttack: !event.defender,
  };
  matStore.attackDeclaration = declaration;
  playEffect(
    event.defender
      ? AudioActionType.SOUND_ATTACK
      : AudioActionType.SOUND_DIRECT_ATTACK,
  );
  await matStore.battlePresentation.play((signal, impact) => {
    let targetHit = Promise.resolve();
    const onImpact = () => {
      // 使用身份判断，旧演出结束时不能清除新一次攻击的指向。
      if (
        matStore.attackDeclaration?.attackerUuid === declaration.attackerUuid &&
        !signal.aborted
      )
        matStore.attackDeclaration = null;
      impact();
    };
    return callCardAttack(attacker.uuid, {
      ...(event.defender
        ? ({ directAttack: false, target: event.defender.location } as const)
        : ({ directAttack: true } as const)),
      attack: event.attacker.attack,
      signal,
      onImpact: () => {
        if (target && !signal.aborted)
          targetHit = callCardHit(target.uuid, {
            origin: event.attacker.location,
            signal,
          });
        onImpact();
      },
    })
      .then(() => targetHit)
      .finally(onImpact);
  });
}

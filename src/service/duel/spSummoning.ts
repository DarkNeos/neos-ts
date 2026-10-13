import { fetchCard, ygopro } from "@/api";
import { TYPE_TOKEN } from "@/common";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";
import { displaySummonEffect } from "@/ui/Duel/PlayMat/SummonEffect";

import { fetchEsHintMeta } from "./util";

export default async (
  container: Container,
  spSummoning: ygopro.StocGameMessage.MsgSpSummoning,
) => {
  if (container.conn.cancelled) return;
  const type = fetchCard(spSummoning.code).data.type ?? 0;
  playEffect(
    type & TYPE_TOKEN
      ? AudioActionType.SOUND_TOKEN
      : AudioActionType.SOUND_SPECIAL_SUMMON,
  );

  const context = container.context;
  fetchEsHintMeta({
    context: context,
    originMsg: "「[?]」特殊召唤宣言时",
    cardID: spSummoning.code,
  });

  context.historyStore.putSpSummon(
    context,
    spSummoning.code,
    spSummoning.location,
  );
  await displaySummonEffect(spSummoning.location, type, "special");
};

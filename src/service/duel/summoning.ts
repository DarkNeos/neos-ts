import { fetchCard, ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";
import { displaySummonEffect } from "@/ui/Duel/PlayMat/SummonEffect";

import { fetchEsHintMeta } from "./util";

export default async (
  container: Container,
  summoning: ygopro.StocGameMessage.MsgSummoning,
) => {
  if (container.conn.cancelled) return;
  playEffect(AudioActionType.SOUND_SUMMON);

  const context = container.context;
  fetchEsHintMeta({
    context: context,
    originMsg: "「[?]」通常召唤宣言时",
    cardID: summoning.code,
  });

  context.historyStore.putSummon(context, summoning.code, summoning.location);
  await displaySummonEffect(
    summoning.location,
    fetchCard(summoning.code).data.type ?? 0,
    "normal",
  );
};

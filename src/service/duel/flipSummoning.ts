import { fetchCard, ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";
import { displaySummonEffect } from "@/ui/Duel/PlayMat/SummonEffect";

import { fetchEsHintMeta } from "./util";

export default async (
  container: Container,
  flipSummoning: ygopro.StocGameMessage.MsgFlipSummoning,
) => {
  if (container.conn.cancelled) return;
  playEffect(AudioActionType.SOUND_FILP);

  const context = container.context;
  fetchEsHintMeta({
    context: context,
    originMsg: "「[?]」反转召唤宣言时",
    cardID: flipSummoning.code,
  });

  context.historyStore.putFlipSummon(
    context,
    flipSummoning.code,
    flipSummoning.location,
  );
  await displaySummonEffect(
    flipSummoning.location,
    fetchCard(flipSummoning.code).data.type ?? 0,
    "flip",
  );
};

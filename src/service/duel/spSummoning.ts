import { ygopro } from "@/api";
import { Container } from "@/container";

import { fetchEsHintMeta } from "./util";

export default (
  container: Container,
  spSummoning: ygopro.StocGameMessage.MsgSpSummoning,
) => {
  // const card = fetchCard(spSummoning.code);
  // if (card.data.type && card.data.type & TYPE_TOKEN) {
  //   playEffect(AudioActionType.SOUND_TOKEN);
  // } else {
  //   playEffect(AudioActionType.SOUND_SPECIAL_SUMMON);
  // }
  fetchEsHintMeta({
    context: container.context,
    originMsg: "「[?]」特殊召唤宣言时",
    cardID: spSummoning.code,
  });
};

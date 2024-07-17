import { ygopro } from "@/api";
import { Container } from "@/container";

import { fetchEsHintMeta } from "./util";

export default (
  container: Container,
  flipSummoning: ygopro.StocGameMessage.MsgFlipSummoning,
) => {
  // playEffect(AudioActionType.SOUND_FILP);
  fetchEsHintMeta({
    context: container.context,
    originMsg: "「[?]」反转召唤宣言时",
    cardID: flipSummoning.code,
  });
};

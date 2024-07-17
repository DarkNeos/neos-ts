import { ygopro } from "@/api";
import { Container } from "@/container";

import { fetchEsHintMeta } from "./util";

export default (
  container: Container,
  summoning: ygopro.StocGameMessage.MsgSummoning,
) => {
  /* 因为现在Neos动画架构的问题，这里播放音效的话会滞后于移动动画，
   * 因此这里先注释掉，等解决掉上述问题后再加上召唤的音效。
   * */
  // playEffect(AudioActionType.SOUND_SUMMON);
  fetchEsHintMeta({
    context: container.context,
    originMsg: "「[?]」通常召唤宣言时",
    cardID: summoning.code,
  });
};

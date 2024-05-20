import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/stores";

export default (flipSummoning: ygopro.StocGameMessage.MsgFlipSummoning) => {
  // playEffect(AudioActionType.SOUND_FILP);
  fetchEsHintMeta({
    originMsg: "「[?]」反转召唤宣言时",
    cardID: flipSummoning.code,
  });
};

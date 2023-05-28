import { ygopro } from "@/api";
import { cardStore } from "@/stores";

type MsgShuffleHand = ygopro.StocGameMessage.MsgShuffleHand;

export default (shuffleHand: MsgShuffleHand) => {
  const { hands: codes, player: controller } = shuffleHand;

  // 本质上是要将手卡的sequence变成和codes一样的顺序
  const hands = cardStore.at(ygopro.CardZone.HAND, controller);
  const t: Record<number, number[]> = {};
  codes.forEach((code, sequence) => {
    t[code] = t[code] || [];
    t[code].push(sequence);
  });
  hands.forEach((hand) => {
    const sequence = t[hand.code].shift();
    if (sequence === undefined) {
      throw new Error("手牌数量和洗牌后的数量不一致");
    }
    hand.sequence = sequence;
  });
};

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
    const target = t[hand.code];
    if (target !== undefined) {
      const sequence = target.shift();
      if (sequence) {
        hand.sequence = sequence;
      } else {
        console.warn(
          `<ShuffleHand>sequence shift from target is null, controller=${controller} hands=${hands}, codes=${codes}`
        );
      }
    } else {
      console.warn(
        `<ShuffleHand>target from records is null, controller=${controller} hands=${hands}, codes=${codes}`
      );
    }
  });
};

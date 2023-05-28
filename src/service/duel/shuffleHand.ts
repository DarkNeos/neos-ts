import { ygopro } from "@/api";
import { cardStore } from "@/stores";

type MsgShuffleHand = ygopro.StocGameMessage.MsgShuffleHand;

export default (shuffleHand: MsgShuffleHand) => {
  const { hands: codes, player: controller } = shuffleHand;

  // 本质上是要将手卡的sequence变成和codes一样的顺序
  const hands = cardStore.at(ygopro.CardZone.HAND, controller);
  const t: Map<number, number[]> = new Map([]);
  codes.forEach((code, sequence) => {
    const v = t.get(code);
    if (v) {
      v.push(sequence);
    } else {
      t.set(code, [sequence]);
    }
  });

  console.log(t);
  hands.forEach((hand) => {
    const target = t.get(hand.code);
    if (target !== undefined) {
      const sequence = target.shift();
      if (sequence) {
        hand.sequence = sequence;
      } else {
        console.warn(
          `<ShuffleHand>sequence shift from target is null, controller=${controller}, target=${target}, codes=${codes}`
        );
      }
    } else {
      console.warn(
        `<ShuffleHand>target from records is null, controller=${controller}, hands=${hands.map(
          (hand) => hand.code
        )}, codes=${codes}`
      );
    }
  });
};

import { ygopro } from "@/api";
import { cardStore } from "@/stores";

type MsgShuffleHand = ygopro.StocGameMessage.MsgShuffleHand;

export default (shuffleHand: MsgShuffleHand) => {
  const { hands: codes, player: controller } = shuffleHand;

  // 本质上是要将手卡的sequence变成和codes一样的顺序
  const hands = cardStore.at(ygopro.CardZone.HAND, controller);
  const hash = [...codes].reduce(
    (hash, code, sequence) => hash.set(code, sequence),
    new Map()
  );

  hands.forEach((hand) => {
    const sequence = hash.get(hand.code);
    if (sequence !== undefined) {
      if (sequence >= 0) {
        hand.location.sequence = sequence;
        hash.set(hand.code, sequence - 1);
      } else {
        console.warn(
          `<ShuffleHand>sequence less than zero, controller=${controller}, code=${hand.code}, sequence=${sequence}`
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

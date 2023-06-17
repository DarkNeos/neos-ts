import { ygopro } from "@/api";
import { eventbus, Task } from "@/infra";
import { cardStore } from "@/stores";

type MsgShuffleHand = ygopro.StocGameMessage.MsgShuffleHand;

export default async (shuffleHand: MsgShuffleHand) => {
  const { hands: codes, player: controller } = shuffleHand;

  // 本质上是要将手卡的sequence变成和codes一样的顺序
  const hands = cardStore.at(ygopro.CardZone.HAND, controller);
  const hash = new Map(codes.map((code) => [code, new Array()]));
  codes.forEach((code, sequence) => {
    hash.get(code)?.push(sequence);
  });

  for (const hand of hands) {
    const sequences = hash.get(hand.code);
    if (sequences !== undefined) {
      const sequence = sequences.pop();
      if (sequence !== undefined) {
        hand.location.sequence = sequence;
        hash.set(hand.code, sequences);

        // 触发动画
        await eventbus.call(Task.Move, hand.uuid);
      } else {
        console.warn(
          `<ShuffleHand>sequence poped is none, controller=${controller}, code=${hand.code}, sequence=${sequence}`
        );
      }
    } else {
      console.warn(
        `<ShuffleHand>target from records is null, controller=${controller}, hands=${hands.map(
          (hand) => hand.code
        )}, codes=${codes}`
      );
    }
  }
};

import { ygopro } from "@/api";
import { eventbus, Task } from "@/infra";
import { cardStore } from "@/stores";

type MsgShuffleHandExtra = ygopro.StocGameMessage.MsgShuffleHandExtra;

export default async (shuffleHandExtra: MsgShuffleHandExtra) => {
  const { cards: codes, player: controller, zone } = shuffleHandExtra;

  // 本质上是要将手卡/额外卡组的sequence变成和codes一样的顺序
  const cards = cardStore.at(zone, controller);
  const hash = new Map(codes.map((code) => [code, new Array()]));
  codes.forEach((code, sequence) => {
    hash.get(code)?.push(sequence);
  });

  for (const card of cards) {
    const sequences = hash.get(card.code);
    if (sequences !== undefined) {
      const sequence = sequences.pop();
      if (sequence !== undefined) {
        card.location.sequence = sequence;
        hash.set(card.code, sequences);

        // 触发动画
        await eventbus.call(Task.Move, card.uuid);
      } else {
        console.warn(
          `<ShuffleHandExtra>sequence poped is none, controller=${controller}, code=${card.code}, sequence=${sequence}`
        );
      }
    } else {
      console.warn(
        `<ShuffleHandExtra>target from records is null, controller=${controller}, cards=${cards.map(
          (card) => card.code
        )}, codes=${codes}`
      );
    }
  }
};

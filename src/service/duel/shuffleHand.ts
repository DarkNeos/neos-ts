import { ygopro } from "@/api";
import { matStore, cardStore } from "@/stores";
import { zip } from "@/ui/Duel/utils";

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

  const uuids = matStore.hands.of(controller).map((hand) => hand.uuid);
  const data = zip(uuids, codes).map(([uuid, id]) => {
    return { uuid, id };
  });

  const indexMap = new Map(codes.map((code, idx) => [code, idx]));
  matStore.hands.of(controller).sort((a, b) => {
    const indexA = indexMap.get(a.occupant?.id ?? 0) ?? 0;
    const indexB = indexMap.get(b.occupant?.id ?? 0) ?? 0;

    return indexA - indexB;
  });
};

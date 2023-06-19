import { ygopro } from "@/api";
import { eventbus, Task } from "@/infra";
import { cardStore } from "@/stores";
import MsgShuffleSetCard = ygopro.StocGameMessage.MsgShuffleSetCard;

export default async (shuffleSetCard: MsgShuffleSetCard) => {
  const from_locations = shuffleSetCard.from_locations;
  const to_locations = shuffleSetCard.to_locations;
  if (from_locations.length != to_locations.length) {
    console.error(
      "<ShuffleSetCard>length of from_locations and to_locations not matched"
    );
    return;
  }
  const count = from_locations.length;
  for (let i = 0; i < count; i++) {
    const from = from_locations[i];
    const to = to_locations[i];

    // TODO: 需要考虑超量么
    const target = cardStore.at(from.zone, from.controller, from.sequence);
    if (target) {
      // 更新位置
      target.location = to;
      // 渲染动画
      await eventbus.call(Task.Move, target.uuid);
    } else {
      console.warn(`<ShuffleSetCard>target from ${from} is null`);
    }
  }
};

import { ygopro } from "@/api";
import { eventbus, Task } from "@/infra";
import { cardStore } from "@/stores";
import MsgShuffleSetCard = ygopro.StocGameMessage.MsgShuffleSetCard;

// 后端传过来的`from_locations`的列表是切洗前场上卡的location，它们在列表里面按照切洗后的顺序排列
export default async (shuffleSetCard: MsgShuffleSetCard) => {
  const zone = shuffleSetCard.zone;
  const from_locations = shuffleSetCard.from_locations;
  if (from_locations.length == 0) {
    console.error("<ShuffleSetCard>from_locations is empty");
    return;
  }
  const controller = from_locations[0].controller;

  // 获取到场上对应zone的卡
  const cards = cardStore.at(zone, controller);
  // 获取场上卡当前所有sequence，并按大小排列
  const sequences = cards
    .map((card) => card.location.sequence)
    .sort((a, b) => a - b);

  if (sequences.length != from_locations.length) {
    console.error(
      "<ShuffleSetCard>length of sequences and from_locations not matched"
    );
    return;
  }

  const count = from_locations.length;
  for (let i = 0; i < count; i++) {
    const from = from_locations[i];
    const to_seq = sequences[i];

    const target = cardStore.at(from.zone, from.controller, from.sequence);
    if (target) {
      // 更新位置
      target.location.sequence = to_seq;
      // 渲染动画
      await eventbus.call(Task.Move, target.uuid);
    } else {
      console.warn(`<ShuffleSetCard>target from ${from} is null`);
    }

    // 同时更新超量素材的sequence(非overlay_sequence)
    for (const overlay of cardStore.findOverlay(
      from.zone,
      from.controller,
      from.sequence
    )) {
      overlay.location.sequence = to_seq;
      await eventbus.call(Task.Move, overlay.uuid);
    }
  }
};

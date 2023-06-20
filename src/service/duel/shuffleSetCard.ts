import { ygopro } from "@/api";
import { eventbus, Task } from "@/infra";
import { cardStore } from "@/stores";
import MsgShuffleSetCard = ygopro.StocGameMessage.MsgShuffleSetCard;

// 后端传过来的`from_locations`的列表是切洗前场上卡的location，它们在列表里面按照切洗后的顺序排列
export default async (shuffleSetCard: MsgShuffleSetCard) => {
  const from_locations = shuffleSetCard.from_locations;
  if (from_locations.length == 0) {
    console.error("<ShuffleSetCard>from_locations is empty");
    return;
  }

  for (const from of from_locations) {
    const target = cardStore.at(from.zone, from.controller, from.sequence);
    if (target) {
      // 设置code为0，洗切后的code会由`UpdateData`指定
      target.code = 0;
      target.meta.id = 0;
      target.meta.text.id = 0;
    } else {
      console.warn(`<ShuffleSetCard>target from ${from} is null`);
    }
  }

  // TODO: 处理超量
};

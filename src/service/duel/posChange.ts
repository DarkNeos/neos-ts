import { ygopro } from "@/api";
import MsgPosChange = ygopro.StocGameMessage.MsgPosChange;
import { eventbus, Task } from "@/infra";
import { cardStore, fetchEsHintMeta } from "@/stores";
export default async (posChange: MsgPosChange) => {
  const { location, controler, sequence } = posChange.card_info;

  const target = cardStore.at(location, controler, sequence);
  if (target) {
    target.location.position = posChange.cur_position;

    // TODO: 暂时用`Move`动画，后续可以单独实现一个改变表示形式的动画
    await eventbus.call(Task.Move, target.uuid);
  } else {
    console.warn(`<PosChange>target from ${posChange.card_info} is null`);
  }

  fetchEsHintMeta({
    originMsg: 1600,
  });
};

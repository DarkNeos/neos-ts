import { ygopro } from "@/api";
import MsgPosChange = ygopro.StocGameMessage.MsgPosChange;
import { cardStore, fetchEsHintMeta } from "@/stores";
import { callCardMove } from "@/ui/Duel/PlayMat/Card";

export default async (posChange: MsgPosChange) => {
  const { location, controller, sequence } = posChange.card_info;

  const target = cardStore.at(location, controller, sequence);
  if (target) {
    target.location.position = posChange.cur_position;

    // TODO: 暂时用`Move`动画，后续可以单独实现一个改变表示形式的动画
    await callCardMove(target.uuid);
  } else {
    console.warn(`<PosChange>target from ${posChange.card_info} is null`);
  }

  fetchEsHintMeta({
    originMsg: 1600,
  });
};

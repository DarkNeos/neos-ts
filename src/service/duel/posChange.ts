import { ygopro } from "@/api";
import MsgPosChange = ygopro.StocGameMessage.MsgPosChange;
import { cardStore, fetchEsHintMeta } from "@/stores";
export default (posChange: MsgPosChange) => {
  const { location, controler, sequence } = posChange.card_info;

  const target = cardStore.at(location, controler, sequence);
  if (target) {
    target.position = posChange.cur_position;
  } else {
    console.warn(`<PosChange>target from ${posChange.card_info} is null`);
  }

  fetchEsHintMeta({
    originMsg: 1600,
  });
};

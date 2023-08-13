import { ygopro } from "@/api";
import { roomStore } from "@/stores";

export default function handResult(pb: ygopro.YgoStocMsg) {
  const msg = pb.stoc_hand_result;
  const me = roomStore.getMePlayer();
  const op = roomStore.getOpPlayer();

  if (me && op) {
    me.moraResult = msg.meResult;
    op.moraResult = msg.opResult;
  } else if (roomStore.selfType !== ygopro.StocTypeChange.SelfType.OBSERVER) {
    console.error("<HandResult>me or op is undefined");
  }
}

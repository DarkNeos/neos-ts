import { ygopro } from "@/api";
import { playerStore } from "@/stores";

export default function handleHsWatchChange(pb: ygopro.YgoStocMsg) {
  const count = pb.stoc_hs_watch_change.count;
  playerStore.observerCount = count;
}

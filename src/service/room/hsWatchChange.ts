import { ygopro } from "@/api";
import { roomStore } from "@/stores";

export default function handleHsWatchChange(pb: ygopro.YgoStocMsg) {
  const count = pb.stoc_hs_watch_change.count;
  roomStore.observerCount = count;
}

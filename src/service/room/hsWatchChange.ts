import { ygopro } from "@/api";
import { Container } from "@/container";

export default function handleHsWatchChange(
  container: Container,
  pb: ygopro.YgoStocMsg,
) {
  const count = pb.stoc_hs_watch_change.count;
  container.context.roomStore.observerCount = count;
}

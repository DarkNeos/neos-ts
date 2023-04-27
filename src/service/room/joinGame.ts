import { ygopro } from "@/api";
import { joinStore } from "@/stores";

export default function handleJoinGame(pb: ygopro.YgoStocMsg) {
  const msg = pb.stoc_join_game;
  // todo
  joinStore.value = true;
}

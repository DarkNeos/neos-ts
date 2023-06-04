import { ygopro } from "@/api";
import { joinStore } from "@/stores";

export default function handleJoinGame(pb: ygopro.YgoStocMsg) {
  const _msg = pb.stoc_join_game;
  // TODO
  joinStore.value = true;
}

import { ygopro } from "@/api";
import { roomStore } from "@/stores";

export default function handleJoinGame(pb: ygopro.YgoStocMsg) {
  const _msg = pb.stoc_join_game;
  // TODO
  roomStore.joined = true;
}

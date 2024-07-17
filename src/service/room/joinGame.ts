import { ygopro } from "@/api";
import { Container } from "@/container";

export default function handleJoinGame(
  container: Container,
  pb: ygopro.YgoStocMsg,
) {
  const _msg = pb.stoc_join_game;
  container.context.roomStore.joined = true;
}

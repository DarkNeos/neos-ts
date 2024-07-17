import { ygopro } from "@/api";
import { Container } from "@/container";

export default function handleDuelEnd(
  container: Container,
  _pb: ygopro.YgoStocMsg,
) {
  container.context.matStore.duelEnd = true;
}

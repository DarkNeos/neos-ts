import { ygopro } from "@/api";
import { moraStore } from "@/stores";

export default function handleDuelStart(_pb: ygopro.YgoStocMsg) {
  moraStore.duelStart = true;
}

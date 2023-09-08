import { ygopro } from "@/api";
import { matStore } from "@/stores";

export default function handleDuelEnd(_pb: ygopro.YgoStocMsg) {
  matStore.duelEnd = true;
}

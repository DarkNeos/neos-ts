import { ygopro } from "@/api";
import { moraStore } from "@/stores";

export default function handleSelectHand(_: ygopro.YgoStocMsg) {
  moraStore.selectHandAble = true;
}

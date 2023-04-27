import { ygopro } from "@/api";
import { moraStore } from "@/stores";

export default function handleSelectTp(_: ygopro.YgoStocMsg) {
  moraStore.selectTpAble = true;
}

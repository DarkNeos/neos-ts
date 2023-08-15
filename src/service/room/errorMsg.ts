import { ygopro } from "@/api";

export default function handleErrorMsg(errorMsg: ygopro.StocErrorMsg) {
  console.log(errorMsg);
}

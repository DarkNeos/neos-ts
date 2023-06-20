import { ygopro } from "@/api";
import MsgFieldDisabled = ygopro.StocGameMessage.MsgFieldDisabled;
export default (fieldDisabled: MsgFieldDisabled) => {
  console.log(fieldDisabled);
};

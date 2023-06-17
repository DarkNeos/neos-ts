import { ygopro } from "@/api";
import MsgToss = ygopro.StocGameMessage.MsgToss;

export default (toss: MsgToss) => {
  console.log(toss);
};

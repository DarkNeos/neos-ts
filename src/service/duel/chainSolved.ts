import { ygopro } from "@/api";

export default (chainSolved: ygopro.StocGameMessage.MsgChainSolved) => {
  console.log(chainSolved);
};

import { ygopro } from "@/api";
import { Container } from "@/container";

import { fetchEsHintMeta } from "./util";

export default (
  container: Container,
  _swap: ygopro.StocGameMessage.MsgSwap,
) => {
  fetchEsHintMeta({ context: container.context, originMsg: 1602 });
};

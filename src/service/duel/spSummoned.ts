import { ygopro } from "@/api";
import { Container } from "@/container";

import { fetchEsHintMeta } from "./util";

export default (
  container: Container,
  _: ygopro.StocGameMessage.MsgSpSummoned,
) => {
  fetchEsHintMeta({ context: container.context, originMsg: 1606 });
};

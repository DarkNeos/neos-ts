import { ygopro } from "@/api";
import { Container } from "@/container";

import { fetchEsHintMeta } from "./util";

export default (container: Container, _set: ygopro.StocGameMessage.MsgSet) => {
  fetchEsHintMeta({ context: container.context, originMsg: 1601 });
};

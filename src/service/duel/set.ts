import { ygopro } from "@/api";
import { Container } from "@/container";

import { fetchEsHintMeta } from "./util";

export default (container: Container, set: ygopro.StocGameMessage.MsgSet) => {
  const context = container.context;
  context.historyStore.putSet(context, set.code, set.location);
  fetchEsHintMeta({ context: context, originMsg: 1601 });
};

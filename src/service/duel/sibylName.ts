import { ygopro } from "@/api";
import { Container } from "@/container";
type MsgSibylName = ygopro.StocGameMessage.MsgSibylName;

export default (container: Container, sibylName: MsgSibylName) => {
  const context = container.context;
  const me = context.roomStore.getMePlayer();
  const op = context.roomStore.getOpPlayer();
  if (me) {
    me.name = sibylName.name_0;
  }
  if (op) {
    op.name = sibylName.name_1;
  }
};

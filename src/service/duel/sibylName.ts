import { ygopro } from "@/api";
import { Container } from "@/container";
type MsgSibylName = ygopro.StocGameMessage.MsgSibylName;

export default (container: Container, sibylName: MsgSibylName) => {
  const context = container.context;
  const me = context.roomStore.getMePlayer();
  const op = context.roomStore.getOpPlayer();
  const firstIsMe = context.matStore.isMe(0);
  if (me) {
    me.name = firstIsMe ? sibylName.name_0 : sibylName.name_1;
  }
  if (op) {
    op.name = firstIsMe ? sibylName.name_1 : sibylName.name_0;
  }
};

import { ygopro } from "@/api";
import { roomStore } from "@/stores";
type MsgSibylName = ygopro.StocGameMessage.MsgSibylName;

export default (sibylName: MsgSibylName) => {
  const me = roomStore.getMePlayer();
  const op = roomStore.getOpPlayer();
  if (me) {
    me.name = sibylName.name_0;
  }
  if (op) {
    op.name = sibylName.name_1;
  }
};

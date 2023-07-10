import { ygopro } from "@/api";
import { playerStore } from "@/stores";
type MsgSibylName = ygopro.StocGameMessage.MsgSibylName;

export default (sibylName: MsgSibylName) => {
  playerStore.getMePlayer().name = sibylName.name_0;
  playerStore.getOpPlayer().name = sibylName.name_1;
};

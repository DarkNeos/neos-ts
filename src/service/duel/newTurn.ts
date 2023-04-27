import { ygopro } from "@/api";
import { matStore } from "@/stores";

export default (newTurn: ygopro.StocGameMessage.MsgNewTurn) => {
  const player = newTurn.player;
  matStore.currentPlayer = player;
};

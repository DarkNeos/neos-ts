import { ygopro } from "@/api";
import { eventbus, Task } from "@/infra";
import { cardStore } from "@/stores";
import MsgSwapGraveDeck = ygopro.StocGameMessage.MsgSwapGraveDeck;
const {DECK, GRAVE} = ygopro.CardZone;

export default async (swapGraveDeck: MsgSwapGraveDeck) => {
  const player = swapGraveDeck.player;
  
  const deck = cardStore.at(DECK, player);
  const grave = cardStore.at(GRAVE, player);

  for (const card of deck) {
    card.location.zone = GRAVE;
    await eventbus.call(Task.Move, card.uuid);
  }

  for (const card of grave) {
    card.location.zone = DECK;
    await eventbus.call(Task.Move, card.uuid);
  }
};

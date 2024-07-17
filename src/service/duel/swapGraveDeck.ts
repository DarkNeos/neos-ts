import { ygopro } from "@/api";
import { callCardMove } from "@/ui/Duel/PlayMat/Card";
import MsgSwapGraveDeck = ygopro.StocGameMessage.MsgSwapGraveDeck;
import { Container } from "@/container";
const { DECK, GRAVE } = ygopro.CardZone;

export default async (
  container: Container,
  swapGraveDeck: MsgSwapGraveDeck,
) => {
  const context = container.context;
  const player = swapGraveDeck.player;

  const deck = context.cardStore.at(DECK, player);
  const grave = context.cardStore.at(GRAVE, player);

  for (const card of deck) {
    card.location.zone = GRAVE;
    await callCardMove(card.uuid);
  }

  for (const card of grave) {
    card.location.zone = DECK;
    await callCardMove(card.uuid);
  }
};

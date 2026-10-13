import { fetchCard, ygopro } from "@/api";
import type { DeckMessage } from "@/api/ocgcore/ocgAdapter/stoc/stocGameMsg/deck";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";
import { registerDuelDialogReset } from "@/stores/duelDialogs";
import { callCardMove, callCardShuffle } from "@/ui/Duel/PlayMat/Card";

import confirmCards from "./confirmCards";

export default async (container: Container, shuffleDeck: DeckMessage) => {
  if (container.conn.cancelled) return;
  const context = container.context;
  const operation = shuffleDeck.deckOperation;
  if (operation?.kind === "reverse") {
    context.matStore.deckReserved = !context.matStore.deckReserved;
    await Promise.all(
      context.cardStore.inner
        .filter(
          (card) =>
            card.location.zone === ygopro.CardZone.DECK &&
            !card.location.is_overlay,
        )
        .map((card) => callCardMove(card.uuid)),
    );
    return;
  }
  const player = shuffleDeck.player;
  const deck = context.cardStore.at(ygopro.CardZone.DECK, player);
  if (operation?.kind === "top") {
    const card = deck
      .slice()
      .sort((a, b) => b.location.sequence - a.location.sequence)[
      operation.offset
    ];
    if (!card) return;
    card.code = operation.code;
    card.meta =
      operation.code > 0
        ? fetchCard(operation.code)
        : { id: 0, data: {}, text: {} };
    card.originalData = { ...card.meta.data };
    card.location.position = operation.faceup
      ? ygopro.CardPosition.FACEUP_ATTACK
      : ygopro.CardPosition.FACEDOWN_DEFENSE;
    await callCardMove(card.uuid);
    if (operation.code > 0)
      await confirmCards(
        container,
        new ygopro.StocGameMessage.MsgConfirmCards({
          player,
          cards: [
            new ygopro.CardInfo({
              code: operation.code,
              controller: player,
              location: ygopro.CardZone.DECK,
              sequence: card.location.sequence,
            }),
          ],
        }),
      );
    return;
  }
  playEffect(AudioActionType.SOUND_SHUFFLE);
  context.matStore.clearChainBindings(deck.map((card) => card.uuid));
  for (const card of deck) {
    context.cardStore.resetFieldState(card);
    card.descriptionHints = {};
    card.code = 0;
    card.meta = { id: 0, data: {}, text: {} };
    card.originalData = undefined;
    card.location.position = ygopro.CardPosition.FACEDOWN_DEFENSE;
  }
  const controller = new AbortController();
  const unregister = registerDuelDialogReset(() => controller.abort());
  try {
    await Promise.all(
      deck.map(async (card) => {
        await callCardMove(card.uuid);
        if (!controller.signal.aborted && !container.conn.isClosed())
          await callCardShuffle(card.uuid, { signal: controller.signal });
      }),
    );
  } finally {
    unregister();
  }
};

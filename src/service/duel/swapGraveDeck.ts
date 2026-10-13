import { ygopro } from "@/api";
import { isExtraDeckCard } from "@/common";
import { callCardMove } from "@/ui/Duel/PlayMat/Card";
import MsgSwapGraveDeck = ygopro.StocGameMessage.MsgSwapGraveDeck;
import { Container } from "@/container";
const { DECK, GRAVE, EXTRA } = ygopro.CardZone;

export default async (
  container: Container,
  swapGraveDeck: MsgSwapGraveDeck,
) => {
  const context = container.context;
  const player = swapGraveDeck.player;

  const bySequence = (
    a: { location: ygopro.CardLocation },
    b: { location: ygopro.CardLocation },
  ) => a.location.sequence - b.location.sequence;
  const deck = context.cardStore.at(DECK, player).slice().sort(bySequence);
  const grave = context.cardStore.at(GRAVE, player).slice().sort(bySequence);
  const extra = context.cardStore.at(EXTRA, player).slice().sort(bySequence);
  context.matStore.clearChainBindings(
    [...deck, ...grave].map((card) => card.uuid),
  );
  let deckSequence = 0;
  let extraSequence = extra.length;

  for (const [sequence, card] of deck.entries()) {
    context.cardStore.resetFieldState(card);
    card.descriptionHints = {};
    card.location.zone = GRAVE;
    card.location.sequence = sequence;
    card.location.position = ygopro.CardPosition.FACEUP_ATTACK;
  }

  for (const card of grave) {
    context.cardStore.resetFieldState(card);
    card.descriptionHints = {};
    const isExtra = isExtraDeckCard(card.meta.data.type ?? 0);
    card.location.zone = isExtra ? EXTRA : DECK;
    card.location.sequence = isExtra ? extraSequence++ : deckSequence++;
    card.location.position = ygopro.CardPosition.FACEDOWN_ATTACK;
  }
  // 里侧额外卡插在表侧额外之前，保持后续按序号更新卡片的地址连续。
  const faceup = [
    ygopro.CardPosition.FACEUP,
    ygopro.CardPosition.FACEUP_ATTACK,
    ygopro.CardPosition.FACEUP_DEFENSE,
  ];
  const allExtra = context.cardStore.at(EXTRA, player).slice().sort(bySequence);
  [
    ...allExtra.filter((card) => !faceup.includes(card.location.position)),
    ...allExtra.filter((card) => faceup.includes(card.location.position)),
  ].forEach((card, sequence) => {
    card.location.sequence = sequence;
  });
  await Promise.all(
    [...deck, ...grave, ...extra].map((card) => callCardMove(card.uuid)),
  );
};

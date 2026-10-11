import { type CardMeta, fetchCard, ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";
import { CardType } from "@/stores";
import { callCardMove } from "@/ui/Duel/PlayMat/Card";

type MsgShuffleHandExtra = ygopro.StocGameMessage.MsgShuffleHandExtra;
const { EXTRA } = ygopro.CardZone;
const { FACEUP, FACEUP_ATTACK, FACEUP_DEFENSE } = ygopro.CardPosition;

const emptyMeta = (): CardMeta => ({ id: 0, data: {}, text: {} });

const setCardCode = (card: CardType, code: number) => {
  if (card.code === code && card.meta.id === code) return;

  card.code = code;
  card.meta = code > 0 ? fetchCard(code) : emptyMeta();
};

const isFaceup = (card: CardType) =>
  [FACEUP, FACEUP_ATTACK, FACEUP_DEFENSE].includes(card.location.position);

export default async (
  container: Container,
  shuffleHandExtra: MsgShuffleHandExtra,
) => {
  const context = container.context;
  playEffect(AudioActionType.SOUND_SHUFFLE);
  const { cards: codes, player: controller, zone } = shuffleHandExtra;

  const cards = context.cardStore
    .at(zone, controller)
    .slice()
    .sort((a, b) => a.location.sequence - b.location.sequence);
  const targetCards =
    zone === EXTRA ? cards.filter((card) => !isFaceup(card)) : cards;
  // 洗牌后不能再把发动记录对应到原来那个手牌位置。
  context.matStore.clearChainBindings(targetCards.map((card) => card.uuid));

  await Promise.all(
    targetCards.map(async (card, index) => {
      const code = codes[index];
      if (code === undefined) {
        console.warn(
          `<ShuffleHandExtra>missing code, controller=${controller}, zone=${zone}, sequence=${card.location.sequence}, codes=${codes}`,
        );
        return;
      }

      context.cardStore.resetFieldState(card);
      setCardCode(card, code);
      card.descriptionHints = {};
      await callCardMove(card.uuid);
    }),
  );
};

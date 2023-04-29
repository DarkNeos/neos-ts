import "@/styles/mat.css";

import React from "react";
import { useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { CardState, DuelFieldState, matStore } from "@/stores";

import { BlockRow, ExtraBlockRow } from "./Block";
import { Card } from "./Card";
import { Menu } from "./Menu";
import YgoZone = ygopro.CardZone;
import YgoPosition = ygopro.CardPosition;

type RenderCard = CardState & {
  sequence: number;
  opponent?: boolean;
};

const HIGH_SCALE = 0.1;
const DEFAULT_HIGH = 1;

export const Mat = () => {
  const snap = useSnapshot(matStore);
  const monsters = snap.monsters;
  const magics = snap.magics;
  const hands = snap.hands;
  const grave = snap.graveyards;
  const banished = snap.banishedZones;
  const deck = snap.decks;
  const extraDeck = snap.extraDecks;

  const mapper =
    (opponent?: boolean) => (state: CardState, sequence: number) => {
      return {
        sequence,
        opponent,
        ...state,
      };
    };
  const filter = (state: CardState) => state.occupant !== undefined;

  const renderCards: RenderCard[] = monsters.me
    .filter(filter)
    .map(mapper())
    .concat(monsters.op.filter(filter).map(mapper(true)))
    .concat(magics.me.filter(filter).map(mapper()))
    .concat(magics.op.filter(filter).map(mapper(true)))
    .concat(hands.me.filter(filter).map(mapper()))
    .concat(hands.op.filter(filter).map(mapper(true)))
    .concat(grave.me.filter(filter).map(mapper()))
    .concat(grave.op.filter(filter).map(mapper(true)))
    .concat(banished.me.filter(filter).map(mapper()))
    .concat(banished.op.filter(filter).map(mapper(true)))
    .concat(deck.me.filter(filter).map(mapper()))
    .concat(deck.op.filter(filter).map(mapper(true)))
    .concat(extraDeck.me.filter(filter).map(mapper()))
    .concat(extraDeck.op.filter(filter).map(mapper(true)));

  renderCards.sort((card_a, card_b) => (card_a.uuid > card_b.uuid ? 1 : 0));

  return (
    <>
      <Menu />
      <div id="life-bar-container">
        <div id="life-bar">{snap.initInfo.me.life}</div>
        <div id="life-bar">{snap.initInfo.op.life}</div>
      </div>
      <div id="camera">
        <div id="board">
          <div id="board-bg">
            <BlockRow states={magics.op.slice(0, 5) as DuelFieldState} />
            <BlockRow
              states={monsters.op.slice(0, 5) as DuelFieldState}
              rightState={magics.op[5] as CardState}
            />
            <ExtraBlockRow
              meLeft={monsters.me[5] as CardState}
              meRight={monsters.me[6] as CardState}
              opLeft={monsters.op[5] as CardState}
              opRight={monsters.op[6] as CardState}
            />
            <BlockRow
              states={monsters.me.slice(0, 5) as DuelFieldState}
              leftState={magics.me[5] as CardState}
            />
            <BlockRow states={magics.me.slice(0, 5) as DuelFieldState} />
          </div>
          {renderCards.map((card) => (
            <Card
              key={card.uuid}
              code={card.occupant!.id}
              row={cardStateToRow(card)}
              col={cardStateToCol(card)}
              hight={CardStateToHigh(card)}
              defense={
                card.location.position === YgoPosition.DEFENSE ||
                card.location.position === YgoPosition.FACEDOWN_DEFENSE ||
                card.location.position === YgoPosition.FACEUP_DEFENSE
              }
              facedown={CardStateToFaceDown(card)}
              vertical={card.location.zone == YgoZone.HAND}
              highlight={card.idleInteractivities.length > 0}
            />
          ))}
        </div>
      </div>
    </>
  );
};

function cardStateToRow(state: RenderCard): number {
  if (state.opponent) {
    switch (state.location.zone) {
      case YgoZone.EXTRA:
      case YgoZone.DECK:
        return 0;
      case YgoZone.HAND:
        return -1;
      case YgoZone.SZONE:
        return state.sequence >= 5 ? 1 : 0;
      case YgoZone.GRAVE:
        return 1;
      case YgoZone.MZONE:
        return state.sequence >= 5 ? 2 : 1;
      case YgoZone.REMOVED:
        return 2;
      default:
        return 0;
    }
  } else {
    switch (state.location.zone) {
      case YgoZone.EXTRA:
      case YgoZone.DECK:
        return 4;
      case YgoZone.HAND:
        return 5;
      case YgoZone.SZONE:
        return state.sequence >= 5 ? 3 : 4;
      case YgoZone.GRAVE:
        return 3;
      case YgoZone.MZONE:
        return state.sequence >= 5 ? 2 : 3;
      case YgoZone.REMOVED:
        return 2;
      default:
        return 0;
    }
  }
}

function cardStateToCol(state: RenderCard): number {
  if (state.opponent) {
    switch (state.location.zone) {
      case YgoZone.EXTRA:
        return 5;
      case YgoZone.HAND:
        return -state.sequence;
      case YgoZone.SZONE:
        return state.sequence >= 5 ? 5 : -state.sequence;
      case YgoZone.DECK:
      case YgoZone.REMOVED:
      case YgoZone.GRAVE:
        return -1;
      case YgoZone.MZONE:
        return state.sequence >= 5
          ? state.sequence == 5
            ? 3
            : 1
          : -state.sequence;
      default:
        return 0;
    }
  } else {
    switch (state.location.zone) {
      case YgoZone.EXTRA:
        return -1;
      case YgoZone.HAND:
        return state.sequence;
      case YgoZone.SZONE:
        return state.sequence >= 5 ? -1 : state.sequence;
      case YgoZone.DECK:
      case YgoZone.REMOVED:
      case YgoZone.GRAVE:
        return 5;
      case YgoZone.MZONE:
        return state.sequence >= 5
          ? state.sequence == 5
            ? 1
            : 3
          : state.sequence;
      default:
        return 0;
    }
  }
}

function CardStateToHigh(state: RenderCard): number {
  switch (state.location.zone) {
    case YgoZone.EXTRA:
    case YgoZone.DECK:
    case YgoZone.REMOVED:
    case YgoZone.GRAVE:
      return state.sequence * HIGH_SCALE;
    case YgoZone.SZONE:
    case YgoZone.MZONE:
    case YgoZone.HAND:
      return DEFAULT_HIGH;
    default:
      return 0;
  }
}

function CardStateToFaceDown(state: RenderCard): boolean {
  const position = state.location.position;

  return (
    position === YgoPosition.FACEDOWN ||
    position === YgoPosition.FACEDOWN_ATTACK ||
    position === YgoPosition.FACEDOWN_DEFENSE ||
    state.occupant!.id == 0
  );
}

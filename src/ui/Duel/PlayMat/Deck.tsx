import * as BABYLON from "@babylonjs/core";

import { useConfig } from "@/config";
import { useAppSelector } from "@/hook";
import { selectMeDeck, selectOpDeck } from "@/reducers/duel/deckSlice";

import { cardSlotRotation } from "../utils";
import { Depth, SingleSlot } from "./SingleSlot";

const NeosConfig = useConfig();

import { matStore } from "@/valtioStores";
import { useSnapshot } from "valtio";

export const CommonDeck = () => {
  // const meDeck = useAppSelector(selectMeDeck).inner;
  // const opDeck = useAppSelector(selectOpDeck).inner;

  const meDeck = useSnapshot(matStore.decks.me);
  const opDeck = useSnapshot(matStore.decks.op);

  return (
    <>
      <SingleSlot
        state={matStore.decks.me}
        position={deckPosition(0, meDeck.length)}
        rotation={cardSlotRotation(false)}
      />
      <SingleSlot
        state={matStore.decks.op}
        position={deckPosition(1, opDeck.length)}
        rotation={cardSlotRotation(true)}
      />
    </>
  );
};

const deckPosition = (player: number, deckLength: number) => {
  const x = player == 0 ? 3.2 : -3.2;
  const y = (Depth * deckLength) / 2 + NeosConfig.ui.card.floating;
  const z = player == 0 ? -3.3 : 3.3;

  return new BABYLON.Vector3(x, y, z);
};

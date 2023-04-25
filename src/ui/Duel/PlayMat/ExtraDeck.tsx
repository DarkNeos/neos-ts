import * as BABYLON from "@babylonjs/core";

import { useConfig } from "@/config";
import { useAppSelector } from "@/hook";
import {
  selectMeExtraDeck,
  selectOpExtraDeck,
} from "@/reducers/duel/extraDeckSlice";

import { cardSlotRotation } from "../utils";
import { Depth, SingleSlot } from "./SingleSlot";

const NeosConfig = useConfig();

import { matStore } from "@/valtioStores";
import { useSnapshot } from "valtio";

export const ExtraDeck = () => {
  // const meExtraDeck = useAppSelector(selectMeExtraDeck).inner;
  // const opExtraDeck = useAppSelector(selectOpExtraDeck).inner;
  const meExtraDeck = useSnapshot(matStore.extraDecks.me);
  const opExtraDeck = useSnapshot(matStore.extraDecks.op);

  return (
    <>
      <SingleSlot
        state={matStore.extraDecks.me}
        position={extraDeckPosition(0, meExtraDeck.length)}
        rotation={cardSlotRotation(false)}
      />
      <SingleSlot
        state={matStore.extraDecks.op}
        position={extraDeckPosition(1, opExtraDeck.length)}
        rotation={cardSlotRotation(true)}
      />
    </>
  );
};

const extraDeckPosition = (player: number, deckLength: number) => {
  const x = player == 0 ? -3.3 : 3.3;
  const y = (Depth & deckLength) / 2 + NeosConfig.ui.card.floating;
  const z = player == 0 ? -3.3 : 3.3;

  return new BABYLON.Vector3(x, y, z);
};

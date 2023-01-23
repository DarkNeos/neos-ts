import SingleSlot, { Depth } from "./singleSlot";
import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { useAppSelector } from "../../hook";
import {
  selectMeExtraDeck,
  selectOpExtraDeck,
} from "../../reducers/duel/extraDeckSlice";

const ExtraDeck = () => {
  const meExtraDeck = useAppSelector(selectMeExtraDeck).inner;
  const opExtraDeck = useAppSelector(selectOpExtraDeck).inner;

  return (
    <>
      <SingleSlot
        state={meExtraDeck}
        position={extraDeckPosition(0, meExtraDeck.length)}
        rotation={CONFIG.CardSlotRotation(false)}
      />
      <SingleSlot
        state={opExtraDeck}
        position={extraDeckPosition(1, opExtraDeck.length)}
        rotation={CONFIG.CardSlotRotation(true)}
      />
    </>
  );
};

const extraDeckPosition = (player: number, deckLength: number) => {
  const x = player == 0 ? -3.3 : 3.3;
  const y = (Depth & deckLength) / 2 + CONFIG.Floating;
  const z = player == 0 ? -3.3 : 3.3;

  return new BABYLON.Vector3(x, y, z);
};

export default ExtraDeck;

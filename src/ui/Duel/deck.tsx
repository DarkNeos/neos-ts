import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { useAppSelector } from "../../hook";
import { selectMeDeck, selectOpDeck } from "../../reducers/duel/deckSlice";
import SingleSlot, { Depth } from "./singleSlot";

const CommonDeck = () => {
  const meDeck = useAppSelector(selectMeDeck).inner;
  const opDeck = useAppSelector(selectOpDeck).inner;

  return (
    <>
      <SingleSlot
        state={meDeck}
        position={deckPosition(0, meDeck.length)}
        rotation={CONFIG.CardSlotRotation(false)}
      />
      <SingleSlot
        state={opDeck}
        position={deckPosition(1, opDeck.length)}
        rotation={CONFIG.CardSlotRotation(true)}
      />
    </>
  );
};

const deckPosition = (player: number, deckLength: number) => {
  const x = player == 0 ? 3.2 : -3.2;
  const y = (Depth * deckLength) / 2 + CONFIG.Floating;
  const z = player == 0 ? -3.3 : 3.3;

  return new BABYLON.Vector3(x, y, z);
};

export default CommonDeck;

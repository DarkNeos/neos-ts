import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { useAppSelector } from "../../hook";
import { selectMeDeck, selectOpDeck } from "../../reducers/duel/deckSlice";
import SingleSlot from "./singleSlot";

const depth = 0.005;

const Deck = () => (
  <>
    <CommonDeck />
    <ExtraDeck />
  </>
);

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

const ExtraDeck = () => {
  const shape = CONFIG.ExtraDeckSlotShape();
  const position = new BABYLON.Vector3(
    -3.3,
    shape.depth / 2 + CONFIG.Floating,
    -3.3
  );
  const rotation = CONFIG.DeckSlotRotation();

  return (
    <box
      name="extra-deck"
      width={shape.width}
      height={shape.height}
      depth={shape.depth}
      position={position}
      rotation={rotation}
    >
      <standardMaterial
        name="extra-deck-mat"
        diffuseColor={CONFIG.ExtraDeckColor()}
      />
    </box>
  );
};

const deckPosition = (player: number, deckLength: number) => {
  const x = player == 0 ? 3.2 : -3.2;
  const y = (depth * deckLength) / 2 + CONFIG.Floating;
  const z = player == 0 ? -3.3 : 3.3;

  return new BABYLON.Vector3(x, y, z);
};

export default Deck;

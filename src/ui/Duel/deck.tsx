import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";

const Deck = () => (
  <>
    <CommonDeck />
    <ExtraDeck />
  </>
);

const CommonDeck = () => {
  const shape = CONFIG.DeckSlotShape();
  const position = new BABYLON.Vector3(
    3.2,
    shape.depth / 2 + CONFIG.Floating,
    -3.3
  );
  const rotation = CONFIG.DeckSlotRotation();

  return (
    <box
      name="common-deck"
      width={shape.width}
      height={shape.height}
      depth={shape.depth}
      position={position}
      rotation={rotation}
    >
      <standardMaterial
        name="common-deck-mat"
        diffuseColor={CONFIG.DeckColor()}
      />
    </box>
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

export default Deck;

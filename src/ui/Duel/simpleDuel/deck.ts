import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "./config";

export default (scene: BABYLON.Scene) => {
  // 卡组
  const deck = BABYLON.MeshBuilder.CreateBox(
    "deck",
    CONFIG.DeckSlotShape(),
    scene
  );
  // 位置
  deck.position = new BABYLON.Vector3(
    3.2,
    CONFIG.DeckSlotShape().depth / 2 + CONFIG.Floating,
    -3.3
  );
  // 旋转
  deck.rotation = CONFIG.DeckSlotRotation();
  // 材质
  const deckMaterial = new BABYLON.StandardMaterial("deckMaterial", scene);
  deckMaterial.diffuseColor = CONFIG.DeckColor();
  deck.material = deckMaterial;

  // 额外卡组

  const extraDeck = BABYLON.MeshBuilder.CreateBox(
    "exraDeck",
    CONFIG.ExtraDeckSlotShape(),
    scene
  );
  // 位置
  extraDeck.position = new BABYLON.Vector3(
    -3.3,
    CONFIG.ExtraDeckSlotShape().depth / 2 + CONFIG.Floating,
    -3.3
  );
  // 旋转
  extraDeck.rotation = CONFIG.DeckSlotRotation();
  // 材质
  const extraDeckMaterial = new BABYLON.StandardMaterial(
    "extraDeckMaterial",
    scene
  );
  extraDeckMaterial.diffuseColor = CONFIG.ExtraDeckColor();
  extraDeck.material = extraDeckMaterial;
};

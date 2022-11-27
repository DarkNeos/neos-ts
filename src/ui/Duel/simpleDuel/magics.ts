import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "./config";

export default (scene: BABYLON.Scene) => {
  const left = -2.15;
  const gap = 1.05;
  const shape = CONFIG.CardSlotShape();

  for (let i = 0; i < 5; i++) {
    const slot = BABYLON.MeshBuilder.CreateBox(`magic${i}`, shape, scene);
    // 位置
    slot.position = new BABYLON.Vector3(
      left + gap * i,
      shape.depth / 2 + CONFIG.Floating,
      -2.6
    );
    // 旋转
    slot.rotation = CONFIG.CardSlotRotation();
    // 材质
    const magicMaterial = new BABYLON.StandardMaterial("magicMaterial", scene);
    magicMaterial.diffuseColor = CONFIG.MagicColor();
    slot.material = magicMaterial;
  }
};

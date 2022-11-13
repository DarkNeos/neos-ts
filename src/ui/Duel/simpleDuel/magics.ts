import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "./config";

export default (scene: BABYLON.Scene) => {
  const left = -2;
  const gap = 1;
  for (let i = 0; i < 5; i++) {
    const slot = BABYLON.MeshBuilder.CreateBox(
      `magic${i}`,
      CONFIG.CardSlotShape(),
      scene
    );
    // 位置
    slot.position = new BABYLON.Vector3(left + gap * i, 0.5, -3);
    // 旋转
    slot.rotation = CONFIG.CardSlotRotation();
    // 材质
    const magicMaterial = new BABYLON.StandardMaterial("magicMaterial", scene);
    magicMaterial.diffuseColor = CONFIG.MagicColor();
    slot.material = magicMaterial;
  }
};

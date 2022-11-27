import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "./config";

export default (scene: BABYLON.Scene) => {
  const xs = [-1.1, 1];
  const shape = CONFIG.CardSlotShape();

  for (let i in xs) {
    const slot = BABYLON.MeshBuilder.CreateBox(
      `extraMonster${i}`,
      shape,
      scene
    );
    // 位置
    slot.position = new BABYLON.Vector3(
      xs[i],
      shape.depth / 2 + CONFIG.Floating,
      0
    );
    // 旋转
    slot.rotation = CONFIG.CardSlotRotation();
    // 材质
    const extraMonsterMaterial = new BABYLON.StandardMaterial(
      "extraMonsterMaterial",
      scene
    );
    extraMonsterMaterial.diffuseColor = CONFIG.extraMonsterColor();
    slot.material = extraMonsterMaterial;
  }
};

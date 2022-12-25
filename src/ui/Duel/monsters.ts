import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { Monster } from "../../reducers/duel/util";

export default (monsters: Monster[], scene: BABYLON.Scene) => {
  const left = -2.15;
  const gap = 1.05;
  const shape = CONFIG.CardSlotShape();

  for (const monster of monsters) {
    const sequence = monster.sequence;
    const slot = BABYLON.MeshBuilder.CreatePlane(
      `monster${sequence}`,
      shape,
      scene
    );
    // 位置
    slot.position = new BABYLON.Vector3(
      left + gap * sequence,
      shape.depth / 2 + CONFIG.Floating,
      -1.35
    );
    // 旋转
    slot.rotation = CONFIG.CardSlotRotation();
    // 材质
    const monsterMaterial = new BABYLON.StandardMaterial(
      "monsterMaterial",
      scene
    );
    monsterMaterial.diffuseTexture = monster.occupant
      ? new BABYLON.Texture(
          `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${monster.occupant.id}.jpg`
        )
      : new BABYLON.Texture(`http://localhost:3030/images/card_slot.png`);
    monsterMaterial.diffuseTexture.hasAlpha = true;
    slot.material = monsterMaterial;

    if (monster.selectInfo) {
      slot.enableEdgesRendering();
      slot.edgesWidth = 2.0;
      slot.edgesColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Yellow());
    } else {
      slot.disableEdgesRendering();
    }
  }
};

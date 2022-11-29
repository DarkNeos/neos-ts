import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "./config";
import { CardMeta } from "../../../api/cards";

export default (hands: CardMeta[], scene: BABYLON.Scene) => {
  const groundShape = CONFIG.GroundShape();
  const handShape = CONFIG.HandShape();
  const gap = groundShape.width / (hands.length - 1);
  const left = -(groundShape.width / 2);
  hands.forEach((item, idx, _) => {
    const hand = BABYLON.MeshBuilder.CreatePlane(
      `hand${idx}`,
      handShape,
      scene
    );
    // 位置
    hand.position = new BABYLON.Vector3(
      left + gap * idx,
      handShape.height / 2,
      -(groundShape.height / 2) - 1
    );
    hand.rotation = CONFIG.HandRotation();
    // 材质
    const handMaterial = new BABYLON.StandardMaterial("handMaterial", scene);
    // 材质贴纸
    handMaterial.diffuseTexture = new BABYLON.Texture(
      `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${item.id}.jpg`,
      scene
    );
    hand.material = handMaterial;
    // 事件管理
    hand.actionManager = new BABYLON.ActionManager(scene);
    // 监听点击事件
    hand.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        (event) => {
          console.log(`<Click>hand: ${idx}`, "card:", item, "event:", event);
        }
      )
    );
  });
};

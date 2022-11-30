import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../../config/ui";
import { CardMeta } from "../../../api/cards";

export default (hands: CardMeta[], scene: BABYLON.Scene) => {
  const handShape = CONFIG.HandShape();
  hands.forEach((item, idx, _) => {
    const hand = BABYLON.MeshBuilder.CreatePlane(
      `hand${idx}`,
      handShape,
      scene
    );
    // 位置
    hand.position = new BABYLON.Vector3(
      item.position?.x,
      item.position?.y,
      item.position?.z
    );
    hand.rotation = new BABYLON.Vector3(
      item.rotation?.x,
      item.rotation?.y,
      item.rotation?.z
    );
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

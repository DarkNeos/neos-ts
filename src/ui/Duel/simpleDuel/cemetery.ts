import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "./config";

export default (scene: BABYLON.Scene) => {
  // 墓地
  const cemetery = BABYLON.MeshBuilder.CreateBox(
    "cemetery",
    CONFIG.CemeterySlotShape()
  );
  // 位置
  cemetery.position = new BABYLON.Vector3(3.2, 0.5, -2.0);
  // 旋转
  cemetery.rotation = CONFIG.CemeterySlotRotation();
  // 材质
  const cemeteryMaterial = new BABYLON.StandardMaterial(
    "cemeteryMaterial",
    scene
  );
  cemeteryMaterial.diffuseColor = CONFIG.CemeteryColor();
  cemetery.material = cemeteryMaterial;
};

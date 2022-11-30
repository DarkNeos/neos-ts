import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../../config/ui";

export default (scene: BABYLON.Scene) => {
  // 墓地
  const shape = CONFIG.CemeterySlotShape();
  const cemetery = BABYLON.MeshBuilder.CreateBox("cemetery", shape);
  // 位置
  cemetery.position = new BABYLON.Vector3(
    3.2,
    shape.depth / 2 + CONFIG.Floating,
    -2.0
  );
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

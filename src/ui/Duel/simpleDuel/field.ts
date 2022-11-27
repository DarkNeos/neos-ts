import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "./config";

export default (scene: BABYLON.Scene) => {
  // 墓地
  const field = BABYLON.MeshBuilder.CreateBox("field", CONFIG.FieldSlotShape());
  // 位置
  field.position = new BABYLON.Vector3(-3.3, 0.5, -2.0);
  // 旋转
  field.rotation = CONFIG.FieldSlotRotation();
  // 材质
  const fieldMaterial = new BABYLON.StandardMaterial("fieldMaterial", scene);
  fieldMaterial.diffuseColor = CONFIG.FieldColor();
  field.material = fieldMaterial;
};

import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { Monster } from "../../reducers/duel/util";
import { clearMonsterSelectInfo } from "../../reducers/duel/mod";
import { store } from "../../store";
import { sendSelectPlaceResponse } from "../../api/ocgcore/ocgHelper";

export default (monsters: Monster[], scene: BABYLON.Scene) => {
  const left = -2.15;
  const gap = 1.05;
  const shape = CONFIG.CardSlotShape();

  for (const monster of monsters) {
    const slot = BABYLON.MeshBuilder.CreatePlane(
      `monster${monster.sequence}`,
      shape,
      scene
    );
    // 位置
    setupMonsterTransform(slot, monster, left, gap, shape);
    // 旋转
    slot.rotation = CONFIG.CardSlotRotation();
    // 材质
    setupMonsterMaterial(slot, monster, scene);
    // 高亮
    setupHintEdge(slot, monster);
    // 事件管理
    setupMonsterAction(slot, monster, scene);
  }
};

function setupMonsterTransform(
  mesh: BABYLON.Mesh,
  state: Monster,
  left: number,
  gap: number,
  shape: { width: number; height: number; depth: number }
) {
  mesh.position = new BABYLON.Vector3(
    left + gap * state.sequence,
    shape.depth / 2 + CONFIG.Floating,
    -1.35
  );
}

function setupMonsterMaterial(
  mesh: BABYLON.Mesh,
  state: Monster,
  scene: BABYLON.Scene
) {
  const monsterMaterial = new BABYLON.StandardMaterial(
    "monsterMaterial",
    scene
  );
  monsterMaterial.diffuseTexture = state.occupant
    ? new BABYLON.Texture(
        `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${state.occupant.id}.jpg`
      )
    : new BABYLON.Texture(`http://localhost:3030/images/card_slot.png`);
  monsterMaterial.diffuseTexture.hasAlpha = true;
  mesh.material = monsterMaterial;
}

function setupHintEdge(mesh: BABYLON.Mesh, state: Monster) {
  if (state.selectInfo) {
    mesh.enableEdgesRendering();
    mesh.edgesWidth = 2.0;
    mesh.edgesColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Yellow());
  } else {
    mesh.disableEdgesRendering();
  }
}

function setupMonsterAction(
  mesh: BABYLON.Mesh,
  state: Monster,
  scene: BABYLON.Scene
) {
  const dispatch = store.dispatch;

  mesh.actionManager = new BABYLON.ActionManager(scene);
  // 监听点击事件
  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnPickTrigger,
      (_event) => {
        if (state.selectInfo) {
          sendSelectPlaceResponse(state.selectInfo.response);
          dispatch(clearMonsterSelectInfo(0));
          dispatch(clearMonsterSelectInfo(1));
        }
      }
    )
  );
}

import * as BABYLON from "@babylonjs/core";
import * as BABYLON_GUI from "@babylonjs/gui";
import * as CONFIG from "../../../config/ui";
import { Card, InteractType } from "../../../reducers/duel/util";
import { sendSelectIdleCmdResponse } from "../../../api/ocgcore/ocgHelper";
import {
  setCardModalImgUrl,
  setCardModalIsOpen,
  setCardModalText,
} from "../../../reducers/duel/mod";
import { store } from "../../../store";

export default (hands: Card[], scene: BABYLON.Scene) => {
  const handShape = CONFIG.HandShape();
  hands.forEach((item, idx, _) => {
    const hand = BABYLON.MeshBuilder.CreatePlane(
      `hand${idx}`,
      handShape,
      scene
    );
    // 位置&旋转
    setupHandTransform(hand, item);
    // 材质
    setupHandMaterial(hand, item, scene);
    // 互动选项
    setupHandInteractivity(hand, item, idx, scene);
    // 事件管理
    setupHandAction(hand, item, idx, scene);
  });
};

function setupHandTransform(mesh: BABYLON.Mesh, state: Card) {
  mesh.position = new BABYLON.Vector3(
    state.transform.position?.x,
    state.transform.position?.y,
    state.transform.position?.z
  );
  mesh.rotation = new BABYLON.Vector3(
    state.transform.rotation?.x,
    state.transform.rotation?.y,
    state.transform.rotation?.z
  );
}

function setupHandMaterial(
  mesh: BABYLON.Mesh,
  state: Card,
  scene: BABYLON.Scene
) {
  const handMaterial = new BABYLON.StandardMaterial(
    `handMaterial${state.meta.id}`,
    scene
  );
  // 材质贴纸
  handMaterial.diffuseTexture = new BABYLON.Texture(
    `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${state.meta.id}.jpg`,
    scene
  );
  mesh.material = handMaterial;
}

function setupHandInteractivity(
  mesh: BABYLON.Mesh,
  state: Card,
  handIdx: number,
  scene: BABYLON.Scene
) {
  const interactShape = CONFIG.HandInteractShape();
  const interactivities = state.interactivities;

  for (let i = 0; i < interactivities.length; i++) {
    const interact = BABYLON.MeshBuilder.CreatePlane(
      `handInteract_${handIdx}_${i}`,
      interactShape,
      scene
    );
    interact.parent = mesh;
    // 调整位置
    interact.translate(
      new BABYLON.Vector3(0, 1, 0),
      CONFIG.HandShape().height / 2 +
        interactShape.height / 2 +
        interactShape.height * i
    );

    const advancedTexture =
      BABYLON_GUI.AdvancedDynamicTexture.CreateForMesh(interact);
    const button = BABYLON_GUI.Button.CreateImageWithCenterTextButton(
      `handInteractButtion_${handIdx}_${i}`,
      interactTypeToString(interactivities[i].interactType),
      "http://localhost:3030/images/interact_button.png"
    );
    button.fontSize = CONFIG.HandInteractFontSize;
    button.color = "white";
    button.onPointerClickObservable.add(() => {
      console.log(`<Interact>hand ${handIdx}`);

      sendSelectIdleCmdResponse(interactivities[i].response);
    });
    advancedTexture.addControl(button);

    interact.visibility = 0.01;
    // interact.setEnabled(false);
  }
}

function setupHandAction(
  mesh: BABYLON.Mesh,
  state: Card,
  _handIdx: number,
  scene: BABYLON.Scene
) {
  const dispatch = store.dispatch;

  mesh.actionManager = new BABYLON.ActionManager(scene);
  mesh.actionManager.isRecursive = true;
  // 监听点击事件
  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnPickTrigger,
      (_event) => {
        dispatch(
          setCardModalText([state.meta.text.name, state.meta.text.desc])
        );
        dispatch(
          setCardModalImgUrl(
            `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${state.meta.id}.jpg`
          )
        );
        dispatch(setCardModalIsOpen(true));
      }
    )
  );
  // 监听`Hover`事件
  //
  // TODO: 应该在`Hover`的时候开启子组件（按钮），`Hover`离开的时候禁用
  mesh.actionManager.registerAction(
    new BABYLON.CombineAction(
      { trigger: BABYLON.ActionManager.OnPointerOverTrigger },
      [
        new BABYLON.SetValueAction(
          {
            trigger: BABYLON.ActionManager.OnPointerOverTrigger,
          },
          mesh,
          "scaling",
          CONFIG.HandHoverScaling()
        ),
        new BABYLON.InterpolateValueAction(
          BABYLON.ActionManager.OnPointerOverTrigger,
          mesh.getChildMeshes(),
          "visibility",
          1.0,
          10
        ),
      ]
    )
  );
  // 监听`Hover`离开事件
  mesh.actionManager.registerAction(
    new BABYLON.CombineAction(
      { trigger: BABYLON.ActionManager.OnPointerOutTrigger },
      [
        new BABYLON.SetValueAction(
          {
            trigger: BABYLON.ActionManager.OnPointerOutTrigger,
          },
          mesh,
          "scaling",
          CONFIG.HandHoverOutScaling()
        ),
        new BABYLON.InterpolateValueAction(
          BABYLON.ActionManager.OnPointerOverTrigger,
          mesh.getChildMeshes(),
          "visibility",
          0.01,
          10
        ),
      ]
    )
  );
}

function interactTypeToString(t: InteractType): string {
  return InteractType[t];
}

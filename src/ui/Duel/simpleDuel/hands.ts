import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../../config/ui";
import { Card, InteractType } from "../../../reducers/duel/util";
import {
  setCardModalImgUrl,
  setCardModalIsOpen,
  setCardModalText,
  setCardModalInteractivies,
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
        dispatch(
          setCardModalInteractivies(
            state.interactivities.map((interactive) => {
              return {
                desc: interactTypeToString(interactive.interactType),
                response: interactive.response,
              };
            })
          )
        );
        dispatch(setCardModalIsOpen(true));
      }
    )
  );
  // 监听`Hover`事件
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
      ]
    )
  );
}

function interactTypeToString(t: InteractType): string {
  switch (t) {
    case InteractType.SUMMON: {
      return "普通召唤";
    }
    case InteractType.SP_SUMMON: {
      return "特殊召唤";
    }
    case InteractType.POS_CHANGE: {
      return "改变表示形式";
    }
    case InteractType.MSET: {
      return "前场放置";
    }
    case InteractType.SSET: {
      return "后场放置";
    }
    case InteractType.ACTIVATE: {
      return "发动效果";
    }
    default: {
      return "未知选项";
    }
  }
}

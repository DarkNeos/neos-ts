// 一些自定义`Hook`

import { ActionEvent } from "@babylonjs/core";
import { IAction } from "@babylonjs/core/Actions/action.js";
import { ActionManager } from "@babylonjs/core/Actions/actionManager.js";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions.js";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { Nullable } from "@babylonjs/core/types.js";
import { MutableRefObject, useEffect, useRef } from "react";

export interface MeshEventType {
  (env: ActionEvent): void;
}

type DependencyList = ReadonlyArray<unknown>;

/**
 * rewritten useClick hook
 *
 * origion ref: https://github.com/brianzinn/react-babylonjs/blob/master/packages/react-babylonjs/src/hooks/utilityHooks.ts#L132
 *
 * Why i rewritten this?: https://github.com/brianzinn/react-babylonjs/issues/209
 *
 * @param onClick What would be passed in the OnPickTrigger from ActionManager
 * @param ownRef to re-use a Ref you already have, otherwise one is created for you and returned.
 * @param deps observation object
 */
export function useClick(
  onClick: MeshEventType,
  ownRef?: MutableRefObject<Nullable<Mesh>>,
  deps?: DependencyList
): [MutableRefObject<Nullable<Mesh>>] {
  const createdRef = useRef<Nullable<Mesh>>(null);
  const ref = ownRef ?? createdRef;

  useEffect(() => {
    if (ref.current) {
      if (ref.current instanceof AbstractMesh) {
        const mesh = ref.current as Mesh;

        if (!mesh.actionManager) {
          mesh.actionManager = new ActionManager(mesh.getScene());
        }

        const action: Nullable<IAction> = mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, function (
            ev: any
          ) {
            onClick(ev);
          })
        );
        return () => {
          // unregister on teardown
          mesh.actionManager?.unregisterAction(action!);
        };
      } else {
        console.warn("onClick hook only supports referencing Meshes");
      }
    }
  }, [...(deps || []), ref]);
  // todo: if use ref.current as dep,  duplicate register action.

  return [ref];
}

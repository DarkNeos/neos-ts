import * as BABYLON from "@babylonjs/core";
import { useRef } from "react";
import { useSnapshot } from "valtio";

import { sendSelectPlaceResponse, ygopro } from "@/api";
import { useConfig } from "@/config";
import { useClick } from "@/hook";
import {
  type CardState,
  clearAllPlaceInteradtivities,
  messageStore,
} from "@/stores";

import { interactTypeToString } from "../utils";

const NeosConfig = useConfig();

const transform = NeosConfig.ui.card.transform;
const defenceRotation = NeosConfig.ui.card.defenceRotation;
const cardDefenceRotation = new BABYLON.Vector3(
  defenceRotation.x,
  defenceRotation.y,
  defenceRotation.z
);

export const FixedSlot = (props: {
  state: CardState;
  sequence: number;
  position: BABYLON.Vector3;
  rotation: BABYLON.Vector3;
  deffenseRotation?: BABYLON.Vector3;
  clearPlaceInteractivitiesAction: (controller: number) => void;
}) => {
  const planeRef = useRef(null);

  const snapState = useSnapshot(props.state);
  const rotation =
    snapState.location.position === ygopro.CardPosition.DEFENSE ||
    snapState.location.position === ygopro.CardPosition.FACEUP_DEFENSE ||
    snapState.location.position === ygopro.CardPosition.FACEDOWN_DEFENSE
      ? props.deffenseRotation || cardDefenceRotation
      : props.rotation;
  const edgesWidth = 2.0;
  const edgesColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Yellow());

  const faceDown =
    snapState.location.position === ygopro.CardPosition.FACEDOWN_DEFENSE ||
    snapState.location.position === ygopro.CardPosition.FACEDOWN_ATTACK ||
    snapState.location.position === ygopro.CardPosition.FACEDOWN;

  useClick(
    (_event) => {
      if (snapState.placeInteractivity) {
        sendSelectPlaceResponse(snapState.placeInteractivity.response);
        // 其实不应该从外面传进来的...
        // props.clearPlaceInteractivitiesAction(0);
        // props.clearPlaceInteractivitiesAction(1);
        clearAllPlaceInteradtivities(0);
        clearAllPlaceInteradtivities(1);
      } else if (snapState.occupant) {
        // 中央弹窗展示选中卡牌信息
        messageStore.cardModal.meta = snapState.occupant;
        messageStore.cardModal.interactivies =
          snapState.idleInteractivities.map((interactivity) => ({
            desc: interactTypeToString(interactivity.interactType),
            response: interactivity.response,
          }));
        messageStore.cardModal.counters = snapState.counters;
        messageStore.cardModal.isOpen = true;

        // 侧边栏展示超量素材信息
        if (
          snapState.overlay_materials &&
          snapState.overlay_materials.length > 0
        ) {
          messageStore.cardListModal.list =
            snapState.overlay_materials?.map((overlay) => ({
              meta: overlay,
              interactivies: [],
            })) || [];
          messageStore.cardListModal.isOpen = true;
        }
      }
    },
    planeRef,
    [snapState]
  );

  return (
    <plane
      name={`fixedslot-${props.sequence}`}
      ref={planeRef}
      width={transform.x}
      height={transform.y}
      position={props.position}
      rotation={rotation}
      enableEdgesRendering
      edgesWidth={
        snapState.placeInteractivity || snapState.idleInteractivities.length > 0
          ? edgesWidth
          : 0
      }
      edgesColor={edgesColor}
    >
      <standardMaterial
        name={`fixedslot-mat-${props.sequence}`}
        diffuseTexture={
          snapState.occupant
            ? faceDown
              ? new BABYLON.Texture(`${NeosConfig.assetsPath}/card_back.jpg`)
              : new BABYLON.Texture(
                  `${NeosConfig.cardImgUrl}/${snapState.occupant.id}.jpg`
                )
            : new BABYLON.Texture(`${NeosConfig.assetsPath}/card_slot.png`)
        }
        alpha={snapState.occupant ? 1 : 0}
      ></standardMaterial>
    </plane>
  );
};

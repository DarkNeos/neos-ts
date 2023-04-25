import * as BABYLON from "@babylonjs/core";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { useRef } from "react";

import { ygopro } from "@/api";
import { sendSelectPlaceResponse } from "@/api/ocgcore/ocgHelper";
import { useConfig } from "@/config";
import { useClick } from "@/hook";
import { CardState } from "@/reducers/duel/generic";
import {
  setCardListModalInfo,
  setCardListModalIsOpen,
  setCardModalCounters,
  setCardModalInteractivies,
  setCardModalIsOpen,
  setCardModalMeta,
} from "@/reducers/duel/mod";
import { store } from "@/store";

import { interactTypeToString } from "../utils";
import { useSnapshot } from "valtio";

import { clearAllIdleInteractivities } from "@/valtioStores";

const NeosConfig = useConfig();

const transform = NeosConfig.ui.card.transform;
const defenceRotation = NeosConfig.ui.card.defenceRotation;
const cardDefenceRotation = new BABYLON.Vector3(
  defenceRotation.x,
  defenceRotation.y,
  defenceRotation.z
);

export const FixedSlot = (props: {
  snapState: CardState;
  sequence: number;
  position: BABYLON.Vector3;
  rotation: BABYLON.Vector3;
  deffenseRotation?: BABYLON.Vector3;
  // clearPlaceInteractivitiesAction: ActionCreatorWithPayload<number, string>;
  clearPlaceInteractivitiesAction: (controller: number) => void;
}) => {
  const planeRef = useRef(null);

  // const snapState = useSnapshot(props.state);
  const snapState = props.snapState;
  const rotation =
    snapState.location.position === ygopro.CardPosition.DEFENSE ||
    snapState.location.position === ygopro.CardPosition.FACEUP_DEFENSE ||
    snapState.location.position === ygopro.CardPosition.FACEDOWN_DEFENSE
      ? props.deffenseRotation || cardDefenceRotation
      : props.rotation;
  const edgesWidth = 2.0;
  const edgesColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Yellow());
  const dispatch = store.dispatch;

  const faceDown =
    snapState.location.position === ygopro.CardPosition.FACEDOWN_DEFENSE ||
    snapState.location.position === ygopro.CardPosition.FACEDOWN_ATTACK ||
    snapState.location.position === ygopro.CardPosition.FACEDOWN;

  useClick(
    (_event) => {
      if (snapState.placeInteractivities) {
        sendSelectPlaceResponse(snapState.placeInteractivities.response);
        // dispatch(props.clearPlaceInteractivitiesAction(0));
        // dispatch(props.clearPlaceInteractivitiesAction(1));
        clearAllIdleInteractivities(0);
        clearAllIdleInteractivities(1);
      } else if (snapState.occupant) {
        // 中央弹窗展示选中卡牌信息
        dispatch(setCardModalMeta(snapState.occupant));
        dispatch(
          setCardModalInteractivies(
            snapState.idleInteractivities.map((interactivity) => {
              return {
                desc: interactTypeToString(interactivity.interactType),
                response: interactivity.response,
              };
            })
          )
        );
        dispatch(setCardModalCounters(snapState.counters));
        dispatch(setCardModalIsOpen(true));

        // 侧边栏展示超量素材信息
        if (
          snapState.overlay_materials &&
          snapState.overlay_materials.length > 0
        ) {
          dispatch(
            setCardListModalInfo(
              snapState.overlay_materials?.map((overlay) => {
                return {
                  meta: overlay,
                  interactivies: [],
                };
              }) || []
            )
          );
          dispatch(setCardListModalIsOpen(true));
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
        snapState.placeInteractivities ||
        snapState.idleInteractivities.length > 0
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

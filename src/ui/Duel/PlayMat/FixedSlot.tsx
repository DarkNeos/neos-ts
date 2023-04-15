import * as BABYLON from "@babylonjs/core";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { useRef } from "react";

import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { sendSelectPlaceResponse } from "@/api/ocgcore/ocgHelper";
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

import NeosConfig from "../../../../neos.config.json";
import { interactTypeToString } from "../utils";

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
  clearPlaceInteractivitiesAction: ActionCreatorWithPayload<number, string>;
}) => {
  const planeRef = useRef(null);

  const rotation =
    props.state.location.position === ygopro.CardPosition.DEFENSE ||
    props.state.location.position === ygopro.CardPosition.FACEUP_DEFENSE ||
    props.state.location.position === ygopro.CardPosition.FACEDOWN_DEFENSE
      ? props.deffenseRotation || cardDefenceRotation
      : props.rotation;
  const edgesWidth = 2.0;
  const edgesColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Yellow());
  const dispatch = store.dispatch;

  const faceDown =
    props.state.location.position === ygopro.CardPosition.FACEDOWN_DEFENSE ||
    props.state.location.position === ygopro.CardPosition.FACEDOWN_ATTACK ||
    props.state.location.position === ygopro.CardPosition.FACEDOWN;

  useClick(
    (_event) => {
      if (props.state.placeInteractivities) {
        sendSelectPlaceResponse(props.state.placeInteractivities.response);
        dispatch(props.clearPlaceInteractivitiesAction(0));
        dispatch(props.clearPlaceInteractivitiesAction(1));
      } else if (props.state.occupant) {
        // 中央弹窗展示选中卡牌信息
        dispatch(setCardModalMeta(props.state.occupant));
        dispatch(
          setCardModalInteractivies(
            props.state.idleInteractivities.map((interactivity) => {
              return {
                desc: interactTypeToString(interactivity.interactType),
                response: interactivity.response,
              };
            })
          )
        );
        dispatch(setCardModalCounters(props.state.counters));
        dispatch(setCardModalIsOpen(true));

        // 侧边栏展示超量素材信息
        if (
          props.state.overlay_materials &&
          props.state.overlay_materials.length > 0
        ) {
          dispatch(
            setCardListModalInfo(
              props.state.overlay_materials?.map((overlay) => {
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
    [props.state]
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
        props.state.placeInteractivities ||
        props.state.idleInteractivities.length > 0
          ? edgesWidth
          : 0
      }
      edgesColor={edgesColor}
    >
      <standardMaterial
        name={`fixedslot-mat-${props.sequence}`}
        diffuseTexture={
          props.state.occupant
            ? faceDown
              ? new BABYLON.Texture(`${NeosConfig.assetsPath}/card_back.jpg`)
              : new BABYLON.Texture(
                  `${NeosConfig.cardImgUrl}/${props.state.occupant.id}.jpg`
                )
            : new BABYLON.Texture(`${NeosConfig.assetsPath}/card_slot.png`)
        }
        alpha={props.state.occupant ? 1 : 0}
      ></standardMaterial>
    </plane>
  );
};

import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { store } from "../../store";
import { CardState } from "../../reducers/duel/generic";
import { useRef } from "react";
import { useClick } from "./hook";
import { sendSelectPlaceResponse } from "../../api/ocgcore/ocgHelper";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import {
  setCardModalImgUrl,
  setCardModalInteractivies,
  setCardModalIsOpen,
  setCardModalText,
} from "../../reducers/duel/mod";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { interactTypeToString } from "./util";
import NeosConfig from "../../../neos.config.json";

const shape = CONFIG.CardSlotShape();

const FixedSlot = (props: {
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
      ? props.deffenseRotation || CONFIG.CardSlotDefenceRotation()
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
        dispatch(
          setCardModalText([
            props.state.occupant.text.name,
            props.state.occupant.text.desc,
          ])
        );
        dispatch(
          setCardModalImgUrl(
            `${NeosConfig.cardImgUrl}/${props.state.occupant.id}.jpg`
          )
        );
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
        dispatch(setCardModalIsOpen(true));
      }
    },
    planeRef,
    [props.state]
  );

  return (
    <plane
      name={`fixedslot-${props.sequence}`}
      ref={planeRef}
      width={shape.width}
      height={shape.height}
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

export default FixedSlot;

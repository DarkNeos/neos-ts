import * as BABYLON from "@babylonjs/core";
import { useRef } from "react";
import { useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { useClick } from "@/hook";
import { type CardState, messageStore } from "@/stores";

import { interactTypeToString } from "../utils";

const NeosConfig = useConfig();
const transform = NeosConfig.ui.card.transform;
export const Depth = 0.005;

export const SingleSlot = (props: {
  state: CardState[];
  position: BABYLON.Vector3;
  rotation: BABYLON.Vector3;
}) => {
  const snapState = useSnapshot(props.state);
  const boxRef = useRef(null);
  const edgeRender =
    snapState.find((item) =>
      item === undefined ? false : item.idleInteractivities.length > 0
    ) !== undefined;
  const edgesWidth = 2.0;
  const edgesColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Yellow());

  useClick(
    (_event) => {
      if (snapState.length != 0) {
        messageStore.cardListModal.list = snapState
          .filter(
            (item) => item.occupant !== undefined && item.occupant.id !== 0
          )
          .map((item) => ({
            meta: item.occupant,
            interactivies: item.idleInteractivities.map((interactivy) => ({
              desc: interactTypeToString(interactivy.interactType),
              response: interactivy.response,
            })),
          }));
        // dispatch(setCardListModalIsOpen(true));
        messageStore.cardListModal.isOpen = true;
      }
    },
    boxRef,
    [snapState]
  );

  return (
    <box
      name="single-slot"
      ref={boxRef}
      scaling={
        new BABYLON.Vector3(transform.x, transform.y, Depth * snapState.length)
      }
      position={props.position}
      rotation={props.rotation}
      enableEdgesRendering
      edgesWidth={edgeRender ? edgesWidth : 0}
      edgesColor={edgesColor}
    >
      <standardMaterial
        name="single-slot-mat"
        diffuseTexture={
          new BABYLON.Texture(`${NeosConfig.assetsPath}/card_back.jpg`)
        }
        alpha={snapState.length == 0 ? 0 : 1}
      />
    </box>
  );
};

import * as BABYLON from "@babylonjs/core";
import { useEffect, useRef, useState } from "react";
import { useHover } from "react-babylonjs";

import { useConfig } from "@/config";
import { useAppSelector, useClick } from "@/hook";
// import { CardState } from "@/reducers/duel/generic";
import { selectMeHands, selectOpHands } from "@/reducers/duel/handsSlice";
import {
  setCardModalInteractivies,
  setCardModalIsOpen,
  setCardModalMeta,
} from "@/reducers/duel/mod";
import { store } from "@/store";
import { matStore, type CardState, messageStore } from "@/valtioStores";
import { useSnapshot, INTERNAL_Snapshot } from "valtio";

import { animated, useSpring } from "../spring";
import { interactTypeToString, zip } from "../utils";

const NeosConfig = useConfig();

const groundShape = NeosConfig.ui.ground;
const left = -(groundShape.width / 2);
const handShape = NeosConfig.ui.card.transform;
const rotation = NeosConfig.ui.card.handRotation;
const handRotation = new BABYLON.Vector3(rotation.x, rotation.y, rotation.z);
const hoverScaling = NeosConfig.ui.card.handHoverScaling;

export const Hands = () => {
  const meHandsState = matStore.hands.me;
  const opHandsState = matStore.hands.op;
  const meHandsSnap = useSnapshot(meHandsState);
  const opHandsSnap = useSnapshot(opHandsState);
  // const meHands = useAppSelector(selectMeHands).inner;
  // const opHands = useAppSelector(selectOpHands).inner;
  const meHandPositions = handPositons(0, meHandsSnap);
  const opHandPositions = handPositons(1, opHandsSnap);
  // const meHandPositions = handPositons(0, meHandsState);
  // const opHandPositions = handPositons(1, opHandsState);

  return (
    <>
      {zip(meHandsState, meHandPositions).map(([hand, position], idx) => {
        return (
          <CHand
            key={idx}
            state={hand}
            sequence={idx}
            position={position}
            rotation={handRotation}
            // cover={(id) => `${NeosConfig.cardImgUrl}/${id}.jpg`}
          />
        );
      })}
      {zip(opHandsState, opHandPositions).map(([hand, position], idx) => {
        return (
          <CHand
            key={idx}
            state={hand}
            sequence={idx}
            position={position}
            rotation={handRotation}
            // cover={(_) => `${NeosConfig.assetsPath}/card_back.jpg`}
            back={true}
          />
        );
      })}
    </>
  );
};

const CHand = (props: {
  state: CardState;
  sequence: number;
  position: BABYLON.Vector3;
  rotation: BABYLON.Vector3;
  back?: boolean;
}) => {
  const hoverScale = new BABYLON.Vector3(
    hoverScaling.x,
    hoverScaling.y,
    hoverScaling.z
  );
  const defaultScale = new BABYLON.Vector3(1, 1, 1);
  const edgesWidth = 2.0;
  const edgesColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Yellow());
  const planeRef = useRef(null);
  const state = props.state;
  const [hovered, setHovered] = useState(false);
  const position = props.position;
  // const dispatch = store.dispatch;

  const [spring, api] = useSpring(
    () => ({
      from: {
        position,
      },
      config: {
        mass: 1.0,
        tension: 170,
        friction: 900,
        precision: 0.01,
        velocity: 0.0,
        clamp: true,
        duration: 2000,
      },
    }),
    []
  );

  useEffect(() => {
    api.start({
      position,
    });
  }, [position]);

  useHover(
    () => setHovered(true),
    () => setHovered(false),
    planeRef
  );

  useClick(
    () => {
      if (state.occupant) {
        // dispatch(setCardModalMeta(state.occupant));
        messageStore.cardModal.meta = state.occupant;
      }
      // dispatch(
      //   setCardModalInteractivies(
      //     state.idleInteractivities.map((interactive) => {
      //       return {
      //         desc: interactTypeToString(interactive.interactType),
      //         response: interactive.response,
      //       };
      //     })
      //   )
      // );
      messageStore.cardModal.interactivies = state.idleInteractivities.map(
        (interactive) => ({
          desc: interactTypeToString(interactive.interactType),
          response: interactive.response,
        })
      );
      // dispatch(setCardModalIsOpen(true));
      messageStore.cardModal.isOpen = true;
    },
    planeRef,
    [state]
  );
  return (
    // @ts-ignore
    <animated.transformNode name="">
      <animated.plane
        name={`hand-${props.sequence}`}
        ref={planeRef}
        width={handShape.x}
        height={handShape.y}
        scaling={hovered ? hoverScale : defaultScale}
        position={spring.position}
        rotation={props.rotation}
        enableEdgesRendering
        edgesWidth={
          // state.idleInteractivities.length > 0 || state.placeInteractivities
          state.idleInteractivities.length > 0 || state.placeInteractivity
            ? edgesWidth
            : 0
        }
        edgesColor={edgesColor}
      >
        <animated.standardMaterial
          name={`hand-mat-${props.sequence}`}
          diffuseTexture={
            // new BABYLON.Texture(props.cover(state.occupant?.id || 0))
            new BABYLON.Texture(
              props.back
                ? `${NeosConfig.assetsPath}/card_back.jpg`
                : `${NeosConfig.cardImgUrl}/${state.occupant?.id || 0}.jpg`
            )
          }
        />
      </animated.plane>
    </animated.transformNode>
  );
};

const handPositons = (
  player: number,
  hands: INTERNAL_Snapshot<CardState[]>
) => {
  const gap = groundShape.width / (hands.length - 1);
  const x = (idx: number) =>
    player == 0 ? left + gap * idx : -left - gap * idx;
  const y = handShape.y / 2;
  const z =
    player == 0 ? -(groundShape.height / 2) - 1 : groundShape.height / 2 + 1;

  return hands.map((_, idx) => new BABYLON.Vector3(x(idx), y, z));
};

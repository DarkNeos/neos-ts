import * as BABYLON from "@babylonjs/core";
import { useAppSelector, useClick } from "@/hook";
import { selectMeHands, selectOpHands } from "@/reducers/duel/handsSlice";
import { CardState } from "@/reducers/duel/generic";
import {
  setCardModalIsOpen,
  setCardModalMeta,
  setCardModalInteractivies,
} from "@/reducers/duel/mod";
import { store } from "@/store";
import { useHover } from "react-babylonjs";
import { useState, useRef, useEffect } from "react";
import { useSpring, animated } from "../spring";
import { zip, interactTypeToString } from "../utils";
import NeosConfig from "../../../../neos.config.json";

const groundShape = NeosConfig.ui.ground;
const left = -(groundShape.width / 2);
const handShape = NeosConfig.ui.card.transform;
const rotation = NeosConfig.ui.card.handRotation;
const handRotation = new BABYLON.Vector3(rotation.x, rotation.y, rotation.z);
const hoverScaling = NeosConfig.ui.card.handHoverScaling;

const Hands = () => {
  const meHands = useAppSelector(selectMeHands).inner;
  const meHandPositions = handPositons(0, meHands);
  const opHands = useAppSelector(selectOpHands).inner;
  const opHandPositions = handPositons(1, opHands);

  return (
    <>
      {zip(meHands, meHandPositions).map(([hand, position], idx) => {
        return (
          <CHand
            key={idx}
            state={hand}
            sequence={idx}
            position={position}
            rotation={handRotation}
            cover={(id) => `${NeosConfig.cardImgUrl}/${id}.jpg`}
          />
        );
      })}
      {zip(opHands, opHandPositions).map(([hand, position], idx) => {
        return (
          <CHand
            key={idx}
            state={hand}
            sequence={idx}
            position={position}
            rotation={handRotation}
            cover={(_) => `${NeosConfig.assetsPath}/card_back.jpg`}
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
  cover: (id: number) => string;
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
  const dispatch = store.dispatch;

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
        dispatch(setCardModalMeta(state.occupant));
      }
      dispatch(
        setCardModalInteractivies(
          state.idleInteractivities.map((interactive) => {
            return {
              desc: interactTypeToString(interactive.interactType),
              response: interactive.response,
            };
          })
        )
      );
      dispatch(setCardModalIsOpen(true));
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
          state.idleInteractivities.length > 0 || state.placeInteractivities
            ? edgesWidth
            : 0
        }
        edgesColor={edgesColor}
      >
        <animated.standardMaterial
          name={`hand-mat-${props.sequence}`}
          diffuseTexture={
            new BABYLON.Texture(props.cover(state.occupant?.id || 0))
          }
        />
      </animated.plane>
    </animated.transformNode>
  );
};

const handPositons = (player: number, hands: CardState[]) => {
  const gap = groundShape.width / (hands.length - 1);
  const x = (idx: number) =>
    player == 0 ? left + gap * idx : -left - gap * idx;
  const y = handShape.y / 2;
  const z =
    player == 0 ? -(groundShape.height / 2) - 1 : groundShape.height / 2 + 1;

  return hands.map((_, idx) => new BABYLON.Vector3(x(idx), y, z));
};

export default Hands;

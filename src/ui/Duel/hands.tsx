import * as BABYLON from "@babylonjs/core";
import { useAppSelector } from "../../hook";
import { selectMeHands, selectOpHands } from "../../reducers/duel/handsSlice";
import * as CONFIG from "../../config/ui";
import { Hand } from "../../reducers/duel/util";
import {
  setCardModalImgUrl,
  setCardModalIsOpen,
  setCardModalText,
  setCardModalInteractivies,
} from "../../reducers/duel/mod";
import { store } from "../../store";
import { useHover } from "react-babylonjs";
import { useClick } from "./hook";
import { useState, useRef, useEffect } from "react";
import { useSpring, animated } from "./spring";
import { zip, interactTypeToString } from "./util";

const groundShape = CONFIG.GroundShape();
const left = -(groundShape.width / 2);
const handShape = CONFIG.HandShape();
const handRotation = CONFIG.HandRotation();

const Hands = () => {
  const meHands = useAppSelector(selectMeHands).cards;
  const meHandPositions = handPositons(0, meHands);
  const opHands = useAppSelector(selectOpHands).cards;
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
            cover={(id) =>
              `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${id}.jpg`
            }
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
            cover={(_) => `http://localhost:3030/images/card_back.jpg`}
          />
        );
      })}
    </>
  );
};

const CHand = (props: {
  state: Hand;
  sequence: number;
  position: BABYLON.Vector3;
  rotation: BABYLON.Vector3;
  cover: (id: number) => string;
}) => {
  const hoverScale = CONFIG.HandHoverScaling();
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
      dispatch(setCardModalText([state.meta.text.name, state.meta.text.desc]));
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
        width={handShape.width}
        height={handShape.height}
        scaling={hovered ? hoverScale : defaultScale}
        position={spring.position}
        rotation={props.rotation}
        enableEdgesRendering
        edgesWidth={state.interactivities.length == 0 ? 0 : edgesWidth}
        edgesColor={edgesColor}
      >
        <animated.standardMaterial
          name={`hand-mat-${props.sequence}`}
          diffuseTexture={new BABYLON.Texture(props.cover(state.meta.id))}
        />
      </animated.plane>
    </animated.transformNode>
  );
};

const handPositons = (player: number, hands: Hand[]) => {
  const gap = groundShape.width / (hands.length - 1);
  const x = (idx: number) =>
    player == 0 ? left + gap * idx : -left - gap * idx;
  const y = handShape.height / 2;
  const z =
    player == 0 ? -(groundShape.height / 2) - 1 : groundShape.height / 2 + 1;

  return hands.map((_, idx) => new BABYLON.Vector3(x(idx), y, z));
};

export default Hands;

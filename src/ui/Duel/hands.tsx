import * as BABYLON from "@babylonjs/core";
import { useAppSelector } from "../../hook";
import { selectMeHands } from "../../reducers/duel/handsSlice";
import * as CONFIG from "../../config/ui";
import { Hand, InteractType } from "../../reducers/duel/util";
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

const groundShape = CONFIG.GroundShape();
const left = -(groundShape.width / 2);

const Hands = () => {
  const hands = useAppSelector(selectMeHands).cards;

  return (
    <>
      {hands.map((hand, idx) => {
        return (
          <CHand
            state={hand}
            idx={idx}
            key={idx}
            gap={groundShape.width / (hands.length - 1)}
          />
        );
      })}
    </>
  );
};

const CHand = (props: { state: Hand; idx: number; gap: number }) => {
  const handShape = CONFIG.HandShape();
  const rotation = CONFIG.HandRotation();
  const hoverScale = CONFIG.HandHoverScaling();
  const defaultScale = new BABYLON.Vector3(1, 1, 1);
  const edgesWidth = 2.0;
  const edgesColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Yellow());
  const planeRef = useRef(null);
  const [state, idx] = [props.state, props.idx];
  const [hovered, setHovered] = useState(false);
  const dispatch = store.dispatch;

  const [position, setPosition] = useState(
    new BABYLON.Vector3(
      left + props.gap * props.idx,
      handShape.height / 2,
      -(groundShape.height / 2) - 1
    )
  );

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
    const newPosition = new BABYLON.Vector3(
      left + props.gap * props.idx,
      handShape.height / 2,
      -(groundShape.height / 2) - 1
    );

    api.start({
      position: newPosition,
    });

    setPosition(newPosition);
  }, [props.idx, props.gap]);

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
        name={`hand-${idx}`}
        ref={planeRef}
        width={handShape.width}
        height={handShape.height}
        scaling={hovered ? hoverScale : defaultScale}
        position={spring.position}
        rotation={rotation}
        enableEdgesRendering
        edgesWidth={state.interactivities.length == 0 ? 0 : edgesWidth}
        edgesColor={edgesColor}
      >
        <animated.standardMaterial
          name={`hand-mat-${idx}`}
          diffuseTexture={
            new BABYLON.Texture(
              `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${state.meta.id}.jpg`
            )
          }
        />
      </animated.plane>
    </animated.transformNode>
  );
};

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

export default Hands;

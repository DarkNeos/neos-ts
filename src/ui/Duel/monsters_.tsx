import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { useClick } from "./hook";
import { store } from "../../store";
import { Monster } from "../../reducers/duel/util";
import "react-babylonjs";
import { useRef } from "react";
import { sendSelectPlaceResponse } from "../../api/ocgcore/ocgHelper";
import { clearMonsterSelectInfo } from "../../reducers/duel/mod";
import { useAppSelector } from "../../hook";
import { selectMeMonsters } from "../../reducers/duel/monstersSlice";

const left = -2.15; // TODO: config
const gap = 1.05;

const Monsters = () => {
  const monsters = useAppSelector(selectMeMonsters).monsters;

  return (
    <>
      {monsters.map((monster, idx) => {
        return <CommonMonster state={monster} key={idx} />;
      })}
      <ExtraMonsters />
    </>
  );
};

const CommonMonster = (props: { state: Monster }) => {
  const planeRef = useRef(null);
  const shape = CONFIG.CardSlotShape();
  const position = new BABYLON.Vector3(
    left + gap * props.state.sequence,
    shape.depth / 2 + CONFIG.Floating,
    -1.35
  );
  const rotation = CONFIG.CardSlotRotation();
  const edgesWidth = 2.0;
  const edgesColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Yellow());
  const dispatch = store.dispatch;

  useClick(
    (_event) => {
      if (props.state.selectInfo) {
        sendSelectPlaceResponse(props.state.selectInfo?.response);
        dispatch(clearMonsterSelectInfo(0));
        dispatch(clearMonsterSelectInfo(1));
      }
    },
    planeRef,
    [props.state]
  );

  return (
    <plane
      name={`monster-${props.state.selectInfo}`}
      ref={planeRef}
      width={shape.width}
      height={shape.height}
      position={position}
      rotation={rotation}
      enableEdgesRendering
      edgesWidth={props.state.selectInfo ? edgesWidth : 0}
      edgesColor={edgesColor}
    >
      <standardMaterial
        name={`monster-mat-${props.state.sequence}`}
        diffuseTexture={
          props.state.occupant
            ? new BABYLON.Texture(
                `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${props.state.occupant.id}.jpg`
              )
            : new BABYLON.Texture(`http://localhost:3030/images/card_slot.png`)
        }
        alpha={0.2}
      ></standardMaterial>
    </plane>
  );
};

// TODO: use props and redux
const ExtraMonsters = () => {
  const xs = [-1.1, 1];
  const shape = CONFIG.CardSlotShape();
  const position = (x: number) =>
    new BABYLON.Vector3(x, shape.depth / 2 + CONFIG.Floating, 0);
  const rotation = CONFIG.CardSlotRotation();

  return (
    <>
      {xs.map((x, idx) => (
        <plane
          name={`extra-monster-${idx}`}
          position={position(x)}
          rotation={rotation}
        >
          <standardMaterial
            name={`extra-monster-mat-${idx}`}
            diffuseTexture={
              new BABYLON.Texture(`http://localhost:3030/images/card_slot.png`)
            }
            alpha={0.2}
          ></standardMaterial>
        </plane>
      ))}
    </>
  );
};

export default Monsters;

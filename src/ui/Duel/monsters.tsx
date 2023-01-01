import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { useClick } from "./hook";
import { store } from "../../store";
import { Monster } from "../../reducers/duel/util";
import "react-babylonjs";
import { useRef } from "react";
import { sendSelectPlaceResponse } from "../../api/ocgcore/ocgHelper";
import {
  clearMonsterSelectInfo,
  setCardModalImgUrl,
  setCardModalInteractivies,
  setCardModalIsOpen,
  setCardModalText,
} from "../../reducers/duel/mod";
import { useAppSelector } from "../../hook";
import {
  selectMeMonsters,
  selectOpMonsters,
} from "../../reducers/duel/monstersSlice";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { zip } from "./util";

const shape = CONFIG.CardSlotShape();
const left = -2.15; // TODO: config
const gap = 1.05;

const Monsters = () => {
  const meMonsters = useAppSelector(selectMeMonsters).monsters;
  const meMonsterPositions = monsterPositions(0, meMonsters);
  const opMonsters = useAppSelector(selectOpMonsters).monsters;
  const opMonsterPositions = monsterPositions(1, opMonsters);

  return (
    <>
      {zip(meMonsters, meMonsterPositions).map(([monster, position], idx) => {
        return (
          <CommonMonster
            state={monster}
            key={idx}
            position={position}
            rotation={CONFIG.CardSlotRotation()}
            deffenseRotation={CONFIG.CardSlotDefenceRotation()}
          />
        );
      })}
      {zip(opMonsters, opMonsterPositions).map(([monster, position], idx) => {
        return (
          <CommonMonster
            state={monster}
            key={idx}
            position={position}
            rotation={CONFIG.CardSlotRotation()}
            deffenseRotation={CONFIG.CardSlotDefenceRotation()}
          />
        );
      })}
      <ExtraMonsters />
      <ExtraMonsters />
    </>
  );
};

const CommonMonster = (props: {
  state: Monster;
  position: BABYLON.Vector3;
  rotation: BABYLON.Vector3;
  deffenseRotation: BABYLON.Vector3;
}) => {
  const planeRef = useRef(null);

  const rotation =
    props.state.position === ygopro.CardPosition.DEFENSE ||
    props.state.position === ygopro.CardPosition.FACEUP_DEFENSE ||
    props.state.position === ygopro.CardPosition.FACEDOWN_DEFENSE
      ? props.deffenseRotation
      : props.rotation;
  const edgesWidth = 2.0;
  const edgesColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Yellow());
  const dispatch = store.dispatch;

  const faceDown =
    props.state.position === ygopro.CardPosition.FACEDOWN_DEFENSE ||
    props.state.position === ygopro.CardPosition.FACEDOWN_ATTACK ||
    props.state.position === ygopro.CardPosition.FACEDOWN;

  useClick(
    (_event) => {
      if (props.state.selectInfo) {
        sendSelectPlaceResponse(props.state.selectInfo.response);
        dispatch(clearMonsterSelectInfo(0));
        dispatch(clearMonsterSelectInfo(1));
      } else if (props.state.occupant) {
        dispatch(
          setCardModalText([
            props.state.occupant.text.name,
            props.state.occupant.text.desc,
          ])
        );
        dispatch(
          setCardModalImgUrl(
            `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${props.state.occupant.id}.jpg`
          )
        );
        dispatch(setCardModalInteractivies([])); // TODO
        dispatch(setCardModalIsOpen(true));
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
      position={props.position}
      rotation={rotation}
      enableEdgesRendering
      edgesWidth={props.state.selectInfo ? edgesWidth : 0}
      edgesColor={edgesColor}
    >
      <standardMaterial
        name={`monster-mat-${props.state.sequence}`}
        diffuseTexture={
          props.state.occupant
            ? faceDown
              ? new BABYLON.Texture(
                  `http://localhost:3030/images/card_back.jpg`
                )
              : new BABYLON.Texture(
                  `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${props.state.occupant.id}.jpg`
                )
            : new BABYLON.Texture(`http://localhost:3030/images/card_slot.png`)
        }
        alpha={props.state.occupant ? 1 : 0}
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
          key={idx}
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

const monsterPositions = (player: number, monsters: Monster[]) => {
  const x = (sequence: number) =>
    player == 0 ? left + gap * sequence : -left - gap * sequence;
  const y = shape.depth / 2 + CONFIG.Floating;
  const z = player == 0 ? -1.35 : 1.35;

  return monsters.map(
    (monster) => new BABYLON.Vector3(x(monster.sequence), y, z)
  );
};

export default Monsters;

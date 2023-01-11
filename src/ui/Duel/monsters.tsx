import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { useClick } from "./hook";
import { store } from "../../store";
import { CardState } from "../../reducers/duel/generic";
import "react-babylonjs";
import { useRef } from "react";
import { sendSelectPlaceResponse } from "../../api/ocgcore/ocgHelper";
import {
  clearMonsterPlaceInteractivities,
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
            rotation={CONFIG.CardSlotRotation(false)}
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
            rotation={CONFIG.CardSlotRotation(true)}
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
  state: CardState;
  position: BABYLON.Vector3;
  rotation: BABYLON.Vector3;
  deffenseRotation: BABYLON.Vector3;
}) => {
  const planeRef = useRef(null);

  const rotation =
    props.state.location.position === ygopro.CardPosition.DEFENSE ||
    props.state.location.position === ygopro.CardPosition.FACEUP_DEFENSE ||
    props.state.location.position === ygopro.CardPosition.FACEDOWN_DEFENSE
      ? props.deffenseRotation
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
        dispatch(clearMonsterPlaceInteractivities(0));
        dispatch(clearMonsterPlaceInteractivities(1));
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
      name={`monster-${props.state.location.sequence}`}
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
        name={`monster-mat-${props.state.location.sequence}`}
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
  const rotation = CONFIG.CardSlotRotation(false);

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

const monsterPositions = (player: number, monsters: CardState[]) => {
  const x = (sequence: number) =>
    player == 0 ? left + gap * sequence : -left - gap * sequence;
  const y = shape.depth / 2 + CONFIG.Floating;
  const z = player == 0 ? -1.35 : 1.35;

  return monsters.map(
    (monster) => new BABYLON.Vector3(x(monster.location.sequence), y, z)
  );
};

export default Monsters;

import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { CardState } from "../../reducers/duel/generic";
import "react-babylonjs";
import { useAppSelector } from "../../hook";
import {
  selectMeMonsters,
  selectOpMonsters,
} from "../../reducers/duel/monstersSlice";
import { zip } from "./util";
import FixedSlot from "./fixedSlot";

const shape = CONFIG.CardSlotShape();
const left = -2.15; // TODO: config
const gap = 1.05;

const Monsters = () => {
  const meMonsters = useAppSelector(selectMeMonsters).inner;
  const meMonsterPositions = monsterPositions(0, meMonsters);
  const opMonsters = useAppSelector(selectOpMonsters).inner;
  const opMonsterPositions = monsterPositions(1, opMonsters);

  return (
    <>
      {zip(meMonsters, meMonsterPositions).map(
        ([monster, position], sequence) => {
          return (
            <FixedSlot
              state={monster}
              key={sequence}
              sequence={sequence}
              position={position}
              rotation={CONFIG.CardSlotRotation(false)}
              deffenseRotation={CONFIG.CardSlotDefenceRotation()}
            />
          );
        }
      )}
      {zip(opMonsters, opMonsterPositions).map(
        ([monster, position], sequence) => {
          return (
            <FixedSlot
              state={monster}
              key={sequence}
              sequence={sequence}
              position={position}
              rotation={CONFIG.CardSlotRotation(true)}
              deffenseRotation={CONFIG.CardSlotDefenceRotation()}
            />
          );
        }
      )}
      <ExtraMonsters />
      <ExtraMonsters />
    </>
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

  return monsters.map((_, sequence) => new BABYLON.Vector3(x(sequence), y, z));
};

export default Monsters;

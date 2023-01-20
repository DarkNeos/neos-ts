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
import { clearMonsterPlaceInteractivities } from "../../reducers/duel/mod";

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
          return sequence < 5 ? (
            <FixedSlot
              state={monster}
              key={sequence}
              sequence={sequence}
              position={position}
              rotation={CONFIG.CardSlotRotation(false)}
              deffenseRotation={CONFIG.CardSlotDefenceRotation()}
              clearPlaceInteractivitiesAction={clearMonsterPlaceInteractivities}
            />
          ) : (
            <></>
          );
        }
      )}
      {zip(opMonsters, opMonsterPositions).map(
        ([monster, position], sequence) => {
          return sequence < 5 ? (
            <FixedSlot
              state={monster}
              key={sequence}
              sequence={sequence}
              position={position}
              rotation={CONFIG.CardSlotRotation(true)}
              deffenseRotation={CONFIG.CardSlotDefenceRotation()}
              clearPlaceInteractivitiesAction={clearMonsterPlaceInteractivities}
            />
          ) : (
            <></>
          );
        }
      )}
      <ExtraMonsters meMonsters={meMonsters} opMonsters={opMonsters} />
    </>
  );
};

// TODO: use props and redux
const ExtraMonsters = (props: {
  meMonsters: CardState[];
  opMonsters: CardState[];
}) => {
  const shape = CONFIG.CardSlotShape();

  const meLeft = props.meMonsters.find((_, sequence) => sequence == 5);
  const meRight = props.meMonsters.find((_, sequence) => sequence == 6);
  const opLeft = props.opMonsters.find((_, sequence) => sequence == 5);
  const opRight = props.opMonsters.find((_, sequence) => sequence == 6);

  const leftPosition = new BABYLON.Vector3(
    -1.1,
    shape.depth / 2 + CONFIG.Floating,
    0
  );
  const rightPosition = new BABYLON.Vector3(
    1.1,
    shape.depth / 2 + CONFIG.Floating,
    0
  );

  const meRotation = CONFIG.CardSlotRotation(false);
  const opRotation = CONFIG.CardSlotRotation(true);

  return (
    <>
      {meLeft ? (
        <FixedSlot
          state={meLeft}
          sequence={5}
          position={leftPosition}
          rotation={meRotation}
          deffenseRotation={CONFIG.CardSlotDefenceRotation()}
          clearPlaceInteractivitiesAction={clearMonsterPlaceInteractivities}
        />
      ) : (
        <></>
      )}
      {meRight ? (
        <FixedSlot
          state={meRight}
          sequence={6}
          position={rightPosition}
          rotation={meRotation}
          deffenseRotation={CONFIG.CardSlotDefenceRotation()}
          clearPlaceInteractivitiesAction={clearMonsterPlaceInteractivities}
        />
      ) : (
        <></>
      )}
      {opLeft ? (
        <FixedSlot
          state={opLeft}
          sequence={5}
          position={rightPosition}
          rotation={opRotation}
          deffenseRotation={CONFIG.CardSlotDefenceRotation()}
          clearPlaceInteractivitiesAction={clearMonsterPlaceInteractivities}
        />
      ) : (
        <></>
      )}
      {opRight ? (
        <FixedSlot
          state={opRight}
          sequence={6}
          position={leftPosition}
          rotation={opRotation}
          deffenseRotation={CONFIG.CardSlotDefenceRotation()}
          clearPlaceInteractivitiesAction={clearMonsterPlaceInteractivities}
        />
      ) : (
        <></>
      )}
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

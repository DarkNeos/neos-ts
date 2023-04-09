import * as BABYLON from "@babylonjs/core";
import { CardState } from "@/reducers/duel/generic";
import "react-babylonjs";
import { useAppSelector } from "@/hook";
import {
  selectMeMonsters,
  selectOpMonsters,
} from "@/reducers/duel/monstersSlice";
import { zip, cardSlotRotation, cardSlotDefenceRotation } from "./util";
import FixedSlot from "./fixedSlot";
import { clearMonsterPlaceInteractivities } from "@/reducers/duel/mod";
import NeosConfig from "../../../neos.config.json";

const transform = NeosConfig.ui.card.transform;
const floating = NeosConfig.ui.card.floating;
const left = -2.15; // TODO: config
const gap = 1.05;

const Monsters = () => {
  const meMonsters = useAppSelector(selectMeMonsters).inner;
  const meMonsterPositions = monsterPositions(0, meMonsters);
  const opMonsters = useAppSelector(selectOpMonsters).inner;
  const opMonsterPositions = monsterPositions(1, opMonsters);

  return (
    <>
      {zip(meMonsters, meMonsterPositions)
        .slice(0, 5)
        .map(([monster, position], sequence) => (
          <FixedSlot
            state={monster}
            key={sequence}
            sequence={sequence}
            position={position}
            rotation={cardSlotRotation(false)}
            deffenseRotation={cardSlotDefenceRotation()}
            clearPlaceInteractivitiesAction={clearMonsterPlaceInteractivities}
          />
        ))}
      {zip(opMonsters, opMonsterPositions)
        .slice(0, 5)
        .map(([monster, position], sequence) => (
          <FixedSlot
            state={monster}
            key={sequence}
            sequence={sequence}
            position={position}
            rotation={cardSlotRotation(true)}
            deffenseRotation={cardSlotDefenceRotation()}
            clearPlaceInteractivitiesAction={clearMonsterPlaceInteractivities}
          />
        ))}
      <ExtraMonsters meMonsters={meMonsters} opMonsters={opMonsters} />
    </>
  );
};

// TODO: use props and redux
const ExtraMonsters = (props: {
  meMonsters: CardState[];
  opMonsters: CardState[];
}) => {
  const meLeft = props.meMonsters.find((_, sequence) => sequence == 5);
  const meRight = props.meMonsters.find((_, sequence) => sequence == 6);
  const opLeft = props.opMonsters.find((_, sequence) => sequence == 5);
  const opRight = props.opMonsters.find((_, sequence) => sequence == 6);

  const leftPosition = new BABYLON.Vector3(-1.1, transform.z / 2 + floating, 0);
  const rightPosition = new BABYLON.Vector3(1.1, transform.z / 2 + floating, 0);

  const meRotation = cardSlotRotation(false);
  const opRotation = cardSlotRotation(true);

  return (
    <>
      {meLeft ? (
        <FixedSlot
          state={meLeft}
          sequence={5}
          position={leftPosition}
          rotation={meRotation}
          deffenseRotation={cardSlotDefenceRotation()}
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
          deffenseRotation={cardSlotDefenceRotation()}
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
          deffenseRotation={cardSlotDefenceRotation()}
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
          deffenseRotation={cardSlotDefenceRotation()}
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
  const y = transform.z / 2 + floating;
  const z = player == 0 ? -1.35 : 1.35;

  return monsters.map((_, sequence) => new BABYLON.Vector3(x(sequence), y, z));
};

export default Monsters;

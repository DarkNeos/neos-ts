import "react-babylonjs";

import * as BABYLON from "@babylonjs/core";
import { type INTERNAL_Snapshot, useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { type CardState, matStore } from "@/stores";

import { cardSlotDefenceRotation, cardSlotRotation, zip } from "../utils";
import { FixedSlot } from "./FixedSlot";

const NeosConfig = useConfig();
const transform = NeosConfig.ui.card.transform;
const floating = NeosConfig.ui.card.floating;
const left = -2.15; // TODO: config
const gap = 1.05;

const clearPlaceInteractivitiesAction = (controller: number) => {
  console.warn("monster clearPlaceInteractivitiesAction");
  matStore.monsters.of(controller).clearPlaceInteractivity();
};

export const Monsters = () => {
  const meMonstersStore = matStore.monsters.me;
  const opMonstersStore = matStore.monsters.op;
  const meMonstersSnap = useSnapshot(meMonstersStore);
  const opMonstersSnap = useSnapshot(opMonstersStore);
  const meMonsterPositions = monsterPositions(0, meMonstersSnap);
  const opMonsterPositions = monsterPositions(1, opMonstersSnap);

  return (
    <>
      {zip(meMonstersStore, meMonsterPositions)
        .slice(0, 5)
        .map(([monster, position], sequence) => (
          <FixedSlot
            state={monster}
            key={sequence}
            sequence={sequence}
            position={position}
            rotation={cardSlotRotation(false)}
            deffenseRotation={cardSlotDefenceRotation()}
            clearPlaceInteractivitiesAction={clearPlaceInteractivitiesAction}
          />
        ))}
      {zip(opMonstersStore, opMonsterPositions)
        .slice(0, 5)
        .map(([monster, position], sequence) => (
          <FixedSlot
            state={monster}
            key={sequence}
            sequence={sequence}
            position={position}
            rotation={cardSlotRotation(true)}
            deffenseRotation={cardSlotDefenceRotation()}
            clearPlaceInteractivitiesAction={clearPlaceInteractivitiesAction}
          />
        ))}
      <ExtraMonsters
        meMonsters={meMonstersStore}
        opMonsters={opMonstersStore}
      />
    </>
  );
};

// TODO: use props and redux
const ExtraMonsters = (props: {
  meMonsters: CardState[];
  opMonsters: CardState[];
}) => {
  const meLeft = props.meMonsters[5];
  const meRight = props.meMonsters[6];
  const opLeft = props.opMonsters[5];
  const opRight = props.opMonsters[6];

  const leftPosition = new BABYLON.Vector3(-1.1, transform.z / 2 + floating, 0);
  const rightPosition = new BABYLON.Vector3(1.1, transform.z / 2 + floating, 0);

  const meRotation = cardSlotRotation(false);
  const opRotation = cardSlotRotation(true);

  return (
    <>
      <FixedSlot
        state={meLeft}
        sequence={5}
        position={leftPosition}
        rotation={meRotation}
        deffenseRotation={cardSlotDefenceRotation()}
        clearPlaceInteractivitiesAction={clearPlaceInteractivitiesAction}
      />
      <FixedSlot
        state={meRight}
        sequence={6}
        position={rightPosition}
        rotation={meRotation}
        deffenseRotation={cardSlotDefenceRotation()}
        clearPlaceInteractivitiesAction={clearPlaceInteractivitiesAction}
      />
      <FixedSlot
        state={opLeft}
        sequence={5}
        position={rightPosition}
        rotation={opRotation}
        deffenseRotation={cardSlotDefenceRotation()}
        clearPlaceInteractivitiesAction={clearPlaceInteractivitiesAction}
      />
      <FixedSlot
        state={opRight}
        sequence={6}
        position={leftPosition}
        rotation={opRotation}
        deffenseRotation={cardSlotDefenceRotation()}
        clearPlaceInteractivitiesAction={clearPlaceInteractivitiesAction}
      />
    </>
  );
};

const monsterPositions = (
  player: number,
  monsters: INTERNAL_Snapshot<CardState[]>
) => {
  const x = (sequence: number) =>
    player == 0 ? left + gap * sequence : -left - gap * sequence;
  const y = transform.z / 2 + floating;
  const z = player == 0 ? -1.35 : 1.35;

  return monsters.map((_, sequence) => new BABYLON.Vector3(x(sequence), y, z));
};

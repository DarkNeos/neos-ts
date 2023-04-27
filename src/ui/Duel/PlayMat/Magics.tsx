import * as BABYLON from "@babylonjs/core";
import { type INTERNAL_Snapshot, useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { type CardState, matStore } from "@/stores";

import { cardSlotRotation, zip } from "../utils";
import { FixedSlot } from "./FixedSlot";

const NeosConfig = useConfig();
// TODO: use config
const left = -2.15;
const gap = 1.05;
const transform = NeosConfig.ui.card.transform;

export const Magics = () => {
  const meMagicState = matStore.magics.me;
  const opMagicState = matStore.magics.op;
  const meMagicsSnap = useSnapshot(meMagicState);
  const opMagicsSnap = useSnapshot(opMagicState);
  const meMagicPositions = magicPositions(0, meMagicsSnap);
  const opMagicPositions = magicPositions(1, opMagicsSnap);

  const clearPlaceInteractivitiesAction = (controller: number) => {
    console.warn("magic clearPlaceInteractivitiesAction");
    matStore.magics.of(controller).clearPlaceInteractivity();
  };

  return (
    <>
      {zip(meMagicState, meMagicPositions)
        .slice(0, 5)
        .map(([magic, position], sequence) => {
          return (
            <FixedSlot
              state={magic}
              key={sequence}
              sequence={sequence}
              position={position}
              rotation={cardSlotRotation(false)}
              clearPlaceInteractivitiesAction={clearPlaceInteractivitiesAction}
            />
          );
        })}
      {zip(opMagicState, opMagicPositions)
        .slice(0, 5)
        .map(([magic, position], sequence) => {
          return (
            <FixedSlot
              state={magic}
              key={sequence}
              sequence={sequence}
              position={position}
              rotation={cardSlotRotation(true)}
              clearPlaceInteractivitiesAction={clearPlaceInteractivitiesAction}
            />
          );
        })}
    </>
  );
};

const magicPositions = (
  player: number,
  magics: INTERNAL_Snapshot<CardState[]>
) => {
  const x = (sequence: number) =>
    player == 0 ? left + gap * sequence : -left - gap * sequence;
  const y = transform.z / 2 + NeosConfig.ui.card.floating;
  const z = player == 0 ? -2.6 : 2.6;

  return magics.map((_, sequence) => new BABYLON.Vector3(x(sequence), y, z));
};

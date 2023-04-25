import * as BABYLON from "@babylonjs/core";

import { useConfig } from "@/config";
import { useAppSelector } from "@/hook";
import {
  selectMeGraveyard,
  selectOpGraveyard,
} from "@/reducers/duel/graveyardSlice";

import { cardSlotRotation } from "../utils";
import { Depth, SingleSlot } from "./SingleSlot";

import { matStore } from "@/valtioStores";
import { useSnapshot } from "valtio";

const NeosConfig = useConfig();
export const Graveyard = () => {
  // const meGraveyard = useAppSelector(selectMeGraveyard).inner;
  // const opGraveyard = useAppSelector(selectOpGraveyard).inner;

  const meGraveyard = useSnapshot(matStore.graveyards.me);
  const opGraveyard = useSnapshot(matStore.graveyards.op);

  return (
    <>
      <SingleSlot
        state={matStore.graveyards.me}
        position={graveyardPosition(0, meGraveyard.length)}
        rotation={cardSlotRotation(false)}
      />
      <SingleSlot
        state={matStore.graveyards.op}
        position={graveyardPosition(1, opGraveyard.length)}
        rotation={cardSlotRotation(true)}
      />
    </>
  );
};

const graveyardPosition = (player: number, graveyardLength: number) => {
  const x = player == 0 ? 3.2 : -3.2;
  const y = (Depth * graveyardLength) / 2 + NeosConfig.ui.card.floating;
  const z = player == 0 ? -2.0 : 2.0;

  return new BABYLON.Vector3(x, y, z);
};

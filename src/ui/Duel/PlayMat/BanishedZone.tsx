import * as BABYLON from "@babylonjs/core";

import { useConfig } from "@/config";
import { useAppSelector } from "@/hook";
import {
  selectMeExclusion,
  selectopExclusion,
} from "@/reducers/duel/exclusionSlice";

import { cardSlotRotation } from "../utils";
import { Depth, SingleSlot } from "./SingleSlot";

const NeosConfig = useConfig();
export const BanishedZone = () => {
  const meExclusion = useAppSelector(selectMeExclusion).inner;
  const opExclusion = useAppSelector(selectopExclusion).inner;

  return (
    <>
      <SingleSlot
        state={meExclusion}
        position={banishedZonePosition(0, meExclusion.length)}
        rotation={cardSlotRotation(false)}
      />
      <SingleSlot
        state={opExclusion}
        position={banishedZonePosition(1, opExclusion.length)}
        rotation={cardSlotRotation(true)}
      />
    </>
  );
};

const banishedZonePosition = (player: number, exclusionLength: number) => {
  const x = player == 0 ? 3.2 : -3.2;
  const y = (Depth * exclusionLength) / 2 + NeosConfig.ui.card.floating;
  const z = player == 0 ? -0.7 : 0.7;

  return new BABYLON.Vector3(x, y, z);
};

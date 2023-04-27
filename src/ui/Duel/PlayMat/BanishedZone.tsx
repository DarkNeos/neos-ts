import * as BABYLON from "@babylonjs/core";
import { useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { matStore } from "@/stores";

import { cardSlotRotation } from "../utils";
import { Depth, SingleSlot } from "./SingleSlot";

const NeosConfig = useConfig();
export const BanishedZone = () => {
  const meBanishedZone = useSnapshot(matStore.banishedZones.me);
  const opBanishedZone = useSnapshot(matStore.banishedZones.op);

  return (
    <>
      <SingleSlot
        // 因为singleSlot里面会有snap，所以这儿可以直接传入store
        state={matStore.banishedZones.me}
        position={banishedZonePosition(0, meBanishedZone.length)}
        rotation={cardSlotRotation(false)}
      />
      <SingleSlot
        state={matStore.banishedZones.op}
        position={banishedZonePosition(1, opBanishedZone.length)}
        rotation={cardSlotRotation(true)}
      />
    </>
  );
};

const banishedZonePosition = (player: number, banishedZoneLength: number) => {
  const x = player == 0 ? 3.2 : -3.2;
  const y = (Depth * banishedZoneLength) / 2 + NeosConfig.ui.card.floating;
  const z = player == 0 ? -0.7 : 0.7;

  return new BABYLON.Vector3(x, y, z);
};

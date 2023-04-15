import * as BABYLON from "@babylonjs/core";

import { useConfig } from "@/config";
import { useAppSelector } from "@/hook";
import {
  selectMeBanishedZone,
  selectOpBanishedZone,
} from "@/reducers/duel/banishedZoneSlice";

import { cardSlotRotation } from "../utils";
import { Depth, SingleSlot } from "./SingleSlot";

const NeosConfig = useConfig();
export const BanishedZone = () => {
  const meBanishedZone = useAppSelector(selectMeBanishedZone).inner;
  const opBanishedZone = useAppSelector(selectOpBanishedZone).inner;

  return (
    <>
      <SingleSlot
        state={meBanishedZone}
        position={banishedZonePosition(0, meBanishedZone.length)}
        rotation={cardSlotRotation(false)}
      />
      <SingleSlot
        state={opBanishedZone}
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

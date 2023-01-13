import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { useAppSelector } from "../../hook";
import {
  selectMeExclusion,
  selectopExclusion,
} from "../../reducers/duel/exclusionSlice";
import SingleSlot, { Depth } from "./singleSlot";

const Exclusion = () => {
  const meExclusion = useAppSelector(selectMeExclusion).inner;
  const opExclusion = useAppSelector(selectopExclusion).inner;

  return (
    <>
      <SingleSlot
        state={meExclusion}
        position={exclusionPosition(0, meExclusion.length)}
        rotation={CONFIG.CardSlotRotation(false)}
      />
      <SingleSlot
        state={opExclusion}
        position={exclusionPosition(1, opExclusion.length)}
        rotation={CONFIG.CardSlotRotation(true)}
      />
    </>
  );
};

const exclusionPosition = (player: number, exclusionLength: number) => {
  const x = player == 0 ? 3.2 : -3.2;
  const y = (Depth * exclusionLength) / 2 + CONFIG.Floating;
  const z = player == 0 ? -0.7 : 0.7;

  return new BABYLON.Vector3(x, y, z);
};

export default Exclusion;

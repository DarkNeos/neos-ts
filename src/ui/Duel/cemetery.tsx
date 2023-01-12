import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import {
  selectMeCemetery,
  selectOpCemetery,
} from "../../reducers/duel/cemeretySlice";
import { useAppSelector } from "../../hook";
import SingleSlot from "./singleSlot";

const depth = 0.02;

const Cemeteries = () => {
  const meCemetery = useAppSelector(selectMeCemetery).inner;
  const opCemetery = useAppSelector(selectOpCemetery).inner;

  return (
    <>
      <SingleSlot
        state={meCemetery}
        position={cemeteryPosition(0, meCemetery.length)}
        rotation={CONFIG.CardSlotRotation(false)}
      />
      <SingleSlot
        state={opCemetery}
        position={cemeteryPosition(1, opCemetery.length)}
        rotation={CONFIG.CardSlotRotation(true)}
      />
    </>
  );
};

const cemeteryPosition = (player: number, cemeteryLength: number) => {
  const x = player == 0 ? 3.2 : -3.2;
  const y = (depth * cemeteryLength) / 2 + CONFIG.Floating;
  const z = player == 0 ? -2.0 : 2.0;

  return new BABYLON.Vector3(x, y, z);
};

export default Cemeteries;

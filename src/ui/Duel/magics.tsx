import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { selectMeMagics, selectOpMagics } from "../../reducers/duel/magicSlice";
import { CardState } from "../../reducers/duel/generic";
import { useAppSelector } from "../../hook";
import { zip } from "./util";
import FixedSlot from "./fixedSlot";
import { clearMagicPlaceInteractivities } from "../../reducers/duel/mod";

// TODO: use config
const left = -2.15;
const gap = 1.05;
const shape = CONFIG.CardSlotShape();

const Magics = () => {
  const meMagics = useAppSelector(selectMeMagics).inner;
  const meMagicPositions = magicPositions(0, meMagics);
  const opMagics = useAppSelector(selectOpMagics).inner;
  const opMagicPositions = magicPositions(1, opMagics);

  return (
    <>
      {zip(meMagics, meMagicPositions)
        .slice(0, 5)
        .map(([magic, position], sequence) => {
          return (
            <FixedSlot
              state={magic}
              key={sequence}
              sequence={sequence}
              position={position}
              rotation={CONFIG.CardSlotRotation(false)}
              clearPlaceInteractivitiesAction={clearMagicPlaceInteractivities}
            />
          );
        })}
      {zip(opMagics, opMagicPositions)
        .slice(0, 5)
        .map(([magic, position], sequence) => {
          return (
            <FixedSlot
              state={magic}
              key={sequence}
              sequence={sequence}
              position={position}
              rotation={CONFIG.CardSlotRotation(true)}
              clearPlaceInteractivitiesAction={clearMagicPlaceInteractivities}
            />
          );
        })}
    </>
  );
};

const magicPositions = (player: number, magics: CardState[]) => {
  const x = (sequence: number) =>
    player == 0 ? left + gap * sequence : -left - gap * sequence;
  const y = shape.depth / 2 + CONFIG.Floating;
  const z = player == 0 ? -2.6 : 2.6;

  return magics.map((_, sequence) => new BABYLON.Vector3(x(sequence), y, z));
};

export default Magics;

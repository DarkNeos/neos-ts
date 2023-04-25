import * as BABYLON from "@babylonjs/core";

import { useConfig } from "@/config";
import { useAppSelector } from "@/hook";
import { selectMeMagics, selectOpMagics } from "@/reducers/duel/magicSlice";
import { clearMagicPlaceInteractivities } from "@/reducers/duel/mod";

import { cardSlotRotation } from "../utils";
import { FixedSlot } from "./FixedSlot";
import { Depth } from "./SingleSlot";

const NeosConfig = useConfig();

import { matStore, clearAllPlaceInteradtivities } from "@/valtioStores";
import { useSnapshot } from "valtio";

export const Field = () => {
  // const meField = useAppSelector(selectMeMagics).inner.find(
  //   (_, sequence) => sequence == 5
  // );
  // const opField = useAppSelector(selectOpMagics).inner.find(
  //   (_, sequence) => sequence == 5
  // );

  // 这儿的find可能是出于某种考虑，以后再深思

  const meField = useSnapshot(matStore.magics.me[5]);
  const opField = useSnapshot(matStore.magics.op[5]);

  const clearPlaceInteractivitiesAction = (controller: number) =>
    matStore.magics.of(controller).clearPlaceInteractivity();
  return (
    <>
      {meField ? (
        <FixedSlot
          snapState={meField}
          sequence={0}
          position={fieldPosition(0)}
          rotation={cardSlotRotation(false)}
          // clearPlaceInteractivitiesAction={clearMagicPlaceInteractivities}
          clearPlaceInteractivitiesAction={clearPlaceInteractivitiesAction}
        />
      ) : (
        <></>
      )}
      {opField ? (
        <FixedSlot
          snapState={opField}
          sequence={0}
          position={fieldPosition(1)}
          rotation={cardSlotRotation(true)}
          // clearPlaceInteractivitiesAction={clearMagicPlaceInteractivities}
          clearPlaceInteractivitiesAction={clearPlaceInteractivitiesAction}
        />
      ) : (
        <></>
      )}
    </>
  );
};

const fieldPosition = (player: number) => {
  const x = player == 0 ? -3.3 : 3.3;
  const y = Depth / 2 + NeosConfig.ui.card.floating;
  const z = player == 0 ? -2.0 : 2.0;

  return new BABYLON.Vector3(x, y, z);
};

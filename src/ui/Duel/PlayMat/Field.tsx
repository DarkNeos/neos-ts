import * as BABYLON from "@babylonjs/core";
import { useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { useConfig } from "@/config";
import { clearAllPlaceInteradtivities, matStore } from "@/stores";

import { cardSlotRotation } from "../utils";
import { FixedSlot } from "./FixedSlot";
import { Depth } from "./SingleSlot";

const NeosConfig = useConfig();
export const Field = () => {
  // 这儿的find可能是出于某种考虑，以后再深思
  const meFieldState = matStore.magics.me[5];
  const meField = useSnapshot(meFieldState);
  const opFieldState = matStore.magics.op[5];
  const opField = useSnapshot(opFieldState);

  const clearPlaceInteractivitiesAction = (controller: number) =>
    clearAllPlaceInteradtivities(controller, ygopro.CardZone.MZONE); // 应该是对的

  return (
    <>
      {meField ? (
        <FixedSlot
          state={meFieldState}
          sequence={0}
          position={fieldPosition(0)}
          rotation={cardSlotRotation(false)}
          clearPlaceInteractivitiesAction={clearPlaceInteractivitiesAction}
        />
      ) : (
        <></>
      )}
      {opField ? (
        <FixedSlot
          state={opFieldState}
          sequence={0}
          position={fieldPosition(1)}
          rotation={cardSlotRotation(true)}
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

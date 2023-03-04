import * as BABYLON from "@babylonjs/core";
import { useAppSelector } from "../../hook";
import { selectMeMagics, selectOpMagics } from "../../reducers/duel/magicSlice";
import { clearMagicPlaceInteractivities } from "../../reducers/duel/mod";
import FixedSlot from "./fixedSlot";
import { Depth } from "./singleSlot";
import NeosConfig from "../../../neos.config.json";
import { cardSlotRotation } from "./util";

const Field = () => {
  const meField = useAppSelector(selectMeMagics).inner.find(
    (_, sequence) => sequence == 5
  );
  const opField = useAppSelector(selectOpMagics).inner.find(
    (_, sequence) => sequence == 5
  );

  return (
    <>
      {meField ? (
        <FixedSlot
          state={meField}
          sequence={0}
          position={fieldPosition(0)}
          rotation={cardSlotRotation(false)}
          clearPlaceInteractivitiesAction={clearMagicPlaceInteractivities}
        />
      ) : (
        <></>
      )}
      {opField ? (
        <FixedSlot
          state={opField}
          sequence={0}
          position={fieldPosition(1)}
          rotation={cardSlotRotation(true)}
          clearPlaceInteractivitiesAction={clearMagicPlaceInteractivities}
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

export default Field;

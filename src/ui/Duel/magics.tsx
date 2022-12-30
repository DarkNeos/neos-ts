import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { selectMeMagics } from "../../reducers/duel/magicSlice";
import { useClick } from "./hook";
import { Magic } from "../../reducers/duel/util";
import { store } from "../../store";
import { useAppSelector } from "../../hook";
import { useRef } from "react";
import { sendSelectPlaceResponse } from "../../api/ocgcore/ocgHelper";
import { clearMagicSelectInfo } from "../../reducers/duel/mod";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";

// TODO: use config
const left = -2.15;
const gap = 1.05;

const Magics = () => {
  const magics = useAppSelector(selectMeMagics).magics;

  return (
    <>
      {magics.map((magic) => {
        return <CMagic state={magic} key={magic.sequence} />;
      })}
    </>
  );
};

const CMagic = (props: { state: Magic }) => {
  const state = props.state;

  const planeRef = useRef(null);
  const shape = CONFIG.CardSlotShape();
  const position = new BABYLON.Vector3(
    left + gap * state.sequence,
    shape.depth / 2 + CONFIG.Floating,
    -2.6
  );
  const rotation = CONFIG.CardSlotRotation();
  const faceDown =
    state.position === ygopro.CardPosition.FACEDOWN ||
    state.position === ygopro.CardPosition.FACEDOWN_ATTACK ||
    state.position === ygopro.CardPosition.FACEDOWN_DEFENSE;
  const edgesWidth = 2.0;
  const edgesColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Yellow());
  const dispatch = store.dispatch;

  useClick(
    (_event) => {
      if (state.selectInfo) {
        sendSelectPlaceResponse(state.selectInfo.response);
        dispatch(clearMagicSelectInfo(0));
        dispatch(clearMagicSelectInfo(1));
      }
    },
    planeRef,
    [state]
  );

  return (
    <plane
      name={`magic-${state.sequence}`}
      ref={planeRef}
      width={shape.width}
      height={shape.height}
      position={position}
      rotation={rotation}
      enableEdgesRendering
      edgesWidth={state.selectInfo ? edgesWidth : 0}
      edgesColor={edgesColor}
    >
      <standardMaterial
        name={`magic-mat-${props.state.sequence}`}
        diffuseTexture={
          state.occupant
            ? faceDown
              ? new BABYLON.Texture(
                  `http://localhost:3030/images/card_back.jpg`
                )
              : new BABYLON.Texture(
                  `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${state.occupant.id}.jpg`
                )
            : new BABYLON.Texture(`http://localhost:3030/images/card_slot.png`)
        }
        alpha={state.occupant ? 1 : 0}
      ></standardMaterial>
    </plane>
  );
};

export default Magics;

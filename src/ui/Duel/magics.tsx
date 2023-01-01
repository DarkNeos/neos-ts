import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { selectMeMagics, selectOpMagics } from "../../reducers/duel/magicSlice";
import { useClick } from "./hook";
import { Magic } from "../../reducers/duel/util";
import { store } from "../../store";
import { useAppSelector } from "../../hook";
import { useRef } from "react";
import { sendSelectPlaceResponse } from "../../api/ocgcore/ocgHelper";
import {
  clearMagicSelectInfo,
  setCardModalImgUrl,
  setCardModalIsOpen,
  setCardModalText,
} from "../../reducers/duel/mod";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { zip } from "./util";

// TODO: use config
const left = -2.15;
const gap = 1.05;
const shape = CONFIG.CardSlotShape();

const Magics = () => {
  const meMagics = useAppSelector(selectMeMagics).magics;
  const meMagicPositions = magicPositions(0, meMagics);
  const opMagics = useAppSelector(selectOpMagics).magics;
  const opMagicPositions = magicPositions(1, opMagics);

  return (
    <>
      {zip(meMagics, meMagicPositions).map(([magic, position]) => {
        return (
          <CMagic
            state={magic}
            key={magic.sequence}
            position={position}
            rotation={CONFIG.CardSlotRotation(false)}
          />
        );
      })}
      {zip(opMagics, opMagicPositions).map(([magic, position]) => {
        return (
          <CMagic
            state={magic}
            key={magic.sequence}
            position={position}
            rotation={CONFIG.CardSlotRotation(true)}
          />
        );
      })}
    </>
  );
};

const CMagic = (props: {
  state: Magic;
  position: BABYLON.Vector3;
  rotation: BABYLON.Vector3;
}) => {
  const state = props.state;
  const planeRef = useRef(null);
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
      } else if (state.occupant) {
        dispatch(
          setCardModalText([state.occupant.text.name, state.occupant.text.desc])
        );
        dispatch(
          setCardModalImgUrl(
            `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${state.occupant.id}.jpg`
          )
        );
        dispatch(setCardModalIsOpen(true));
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
      position={props.position}
      rotation={props.rotation}
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

const magicPositions = (player: number, magics: Magic[]) => {
  const x = (sequence: number) =>
    player == 0 ? left + gap * sequence : -left - gap * sequence;
  const y = shape.depth / 2 + CONFIG.Floating;
  const z = player == 0 ? -2.6 : 2.6;

  return magics.map((magic) => new BABYLON.Vector3(x(magic.sequence), y, z));
};

export default Magics;

import React from "react";
import { Engine, Scene } from "react-babylonjs";
import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import DuelHands from "./hands_";
import { selectMeHands } from "../../reducers/duel/handsSlice";
import { useAppSelector } from "../../hook";
import CardModal from "./cardModal";
import HintNotification from "./hintNotification";

const BabylonCanvas = () => {
  const hands = useAppSelector(selectMeHands).cards;

  return (
    <div>
      <Engine antialias adaptToDeviceRatio canvasId="babylonJS">
        <Scene>
          <DuelCamera />
          <DuelLight />
          <DuelHands hands={hands} />
          <DuelGround />
        </Scene>
      </Engine>
      <CardModal />
      <HintNotification />
    </div>
  );
};

const DuelCamera = () => (
  <freeCamera
    name="duel-camera"
    position={new BABYLON.Vector3(0, 8, -10)}
    target={BABYLON.Vector3.Zero()}
  ></freeCamera>
);

const DuelLight = () => (
  <hemisphericLight
    name="duel-light"
    direction={new BABYLON.Vector3(1, 2.5, 1)}
    intensity={0.7}
  ></hemisphericLight>
);

const DuelGround = () => {
  const shape = CONFIG.GroundShape();
  const texture = new BABYLON.Texture(
    `http://localhost:3030/images/newfield.png`
  );
  texture.hasAlpha = true;

  return (
    <ground name="duel-ground" width={shape.width} height={shape.height}>
      <standardMaterial
        name="duel-ground-mat"
        diffuseTexture={texture}
      ></standardMaterial>
    </ground>
  );
};

export default BabylonCanvas;

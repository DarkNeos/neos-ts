import React from "react";
import { Engine, Scene } from "react-babylonjs";
import { ReactReduxContext, Provider } from "react-redux";
import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import Hands from "./hands";
import Monsters from "./monsters";
import CardModal from "./cardModal";
import HintNotification from "./hintNotification";
import Magics from "./magics";
import Field from "./field";
import Deck from "./deck";
import Exclusion from "./exclusion";
import Cemeteries from "./cemetery";
import CardListModal from "./cardListModal";
import CheckCardModal from "./checkCardModal";
import YesNoModal from "./yesNoModal";
import PositionModal from "./positionModal";

// Ref: https://github.com/brianzinn/react-babylonjs/issues/126
const NeosDuel = () => (
  <>
    <ReactReduxContext.Consumer>
      {({ store }) => (
        <Engine antialias adaptToDeviceRatio canvasId="babylonJS">
          <Scene>
            <Provider store={store}>
              <Camera />
              <Light />
              <Hands />
              <Monsters />
              <Magics />
              <Field />
              <Deck />
              <Cemeteries />
              <Exclusion />
              <Ground />
            </Provider>
          </Scene>
        </Engine>
      )}
    </ReactReduxContext.Consumer>
    <CardModal />
    <CardListModal />
    <HintNotification />
    <CheckCardModal />
    <YesNoModal />
    <PositionModal />
  </>
);

const Camera = () => (
  <freeCamera
    name="duel-camera"
    position={new BABYLON.Vector3(0, 8, -10)}
    target={BABYLON.Vector3.Zero()}
  ></freeCamera>
);

const Light = () => (
  <hemisphericLight
    name="duel-light"
    direction={new BABYLON.Vector3(1, 2.5, 1)}
    intensity={0.7}
  ></hemisphericLight>
);

const Ground = () => {
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

export default NeosDuel;

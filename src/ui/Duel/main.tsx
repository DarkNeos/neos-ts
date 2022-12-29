import React from "react";
import { Engine, Scene } from "react-babylonjs";
import { ReactReduxContext, Provider } from "react-redux";
import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import Hands from "./hands_";
import Monsters from "./monsters_";
import CardModal from "./cardModal";
import HintNotification from "./hintNotification";
import Magics from "./magics_";
import Field from "./field_";
import Deck from "./deck_";
import Exclusion from "./exclusion_";

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
              <Exclusion />
              <Ground />
            </Provider>
          </Scene>
        </Engine>
      )}
    </ReactReduxContext.Consumer>
    <CardModal />
    <HintNotification />
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

import * as BABYLON from "@babylonjs/core";
import { Row } from "antd";
import React from "react";
import { Engine, Scene } from "react-babylonjs";
import { Provider, ReactReduxContext } from "react-redux";

import NeosConfig from "../../../neos.config.json";
import NeosLayout from "./Layout";
import {
  Alert,
  CardListModal,
  CardModal,
  CheckCardModal,
  CheckCardModalV2,
  CheckCardModalV3,
  CheckCounterModal,
  DuelTimeLine,
  HintNotification,
  OptionModal,
  Phase,
  PlayerStatus,
  PositionModal,
  SendBox,
  SortCardModal,
  YesNoModal,
} from "./Message";
import {
  ExtraDeck,
  Field,
  Graveyard,
  Hands,
  Magics,
  Monsters,
} from "./PlayMat";
import { BanishedZone } from "./PlayMat/BanishedZone";
import { CommonDeck } from "./PlayMat/Deck";

// Ref: https://github.com/brianzinn/react-babylonjs/issues/126
const NeosDuel = () => {
  return (
    <>
      <Alert />
      <NeosLayout
        sider={<NeosSider />}
        header={<PlayerStatus />}
        content={<NeosCanvas />}
        footer={<Phase />}
      />
      <CardModal />
      <CardListModal />
      <HintNotification />
      <CheckCardModal />
      <YesNoModal />
      <PositionModal />
      <OptionModal />
      <CheckCardModalV2 />
      <CheckCardModalV3 />
      <CheckCounterModal />
      <SortCardModal />
    </>
  );
};

const NeosSider = () => (
  <>
    <Row>
      <DuelTimeLine />
    </Row>
    <Row>
      <SendBox />
    </Row>
  </>
);

const NeosCanvas = () => (
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
            <CommonDeck />
            <ExtraDeck />
            <Graveyard />
            <BanishedZone />
            <Field />
            <Ground />
          </Provider>
        </Scene>
      </Engine>
    )}
  </ReactReduxContext.Consumer>
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
  const shape = NeosConfig.ui.ground;
  const texture = new BABYLON.Texture(`${NeosConfig.assetsPath}/newfield.png`);
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

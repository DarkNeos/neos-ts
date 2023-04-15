import React from "react";
import { Engine, Scene } from "react-babylonjs";
import { ReactReduxContext, Provider } from "react-redux";
import * as BABYLON from "@babylonjs/core";
import {
  Hands,
  Monsters,
  Magics,
  Field,
  Graveyard,
  ExtraDeck,
} from "./PlayMat";
import {
  CardModal,
  HintNotification,
  CardListModal,
  CheckCardModal,
  YesNoModal,
  PositionModal,
  OptionModal,
  Phase,
  CheckCardModalV2,
  DuelTimeLine,
  SendBox,
  PlayerStatus,
  Alert,
  CheckCardModalV3,
  CheckCounterModal,
  SortCardModal,
} from "./Message";
import { CommonDeck } from "./PlayMat/Deck";
import { BanishedZone } from "./PlayMat/BanishedZone";
import NeosLayout from "./Layout";
import NeosConfig from "../../../neos.config.json";
import { Row } from "antd";

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

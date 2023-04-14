import React from "react";
import { Engine, Scene } from "react-babylonjs";
import { ReactReduxContext, Provider } from "react-redux";
import * as BABYLON from "@babylonjs/core";
import Hands from "./PlayMat/Hands";
import Monsters from "./PlayMat/Monsters";
import CardModal from "./Message/CardModal";
import HintNotification from "./Message/HintNotification";
import Magics from "./PlayMat/Magics";
import Field from "./PlayMat/Field";
import CommonDeck from "./PlayMat/Deck";
import Exclusion from "./PlayMat/BanishedZone";
import Graveyard from "./PlayMat/Graveyard";
import CardListModal from "./Message/CardListModal";
import CheckCardModal from "./Message/CheckCardModal";
import YesNoModal from "./Message/YesNoModal";
import PositionModal from "./Message/PositionModal";
import OptionModal from "./Message/OptionModal";
import Phase from "./Message/Phase";
import CheckCardModalV2 from "./Message/CheckCardModalV2";
import ExtraDeck from "./PlayMat/ExtraDeck";
import NeosLayout from "./Layout";
import NeosConfig from "../../../neos.config.json";
import DuelTimeLine from "./Message/TimeLine";
import { Row } from "antd";
import SendBox from "./Message/SendBox";
import PlayerStatus from "./Message/Status";
import Alert from "./Message/Alert";
import CheckCardModalV3 from "./Message/CheckCardModalV3";
import CheckCounterModal from "./Message/CheckCounterModal";
import SortCardModal from "./Message/SortCardModal";

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
            <Exclusion />
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

import React from "react";
import { Engine, Scene } from "react-babylonjs";
import { ReactReduxContext, Provider } from "react-redux";
import * as BABYLON from "@babylonjs/core";
import Hands from "./PlayMat/hands";
import Monsters from "./PlayMat/monsters";
import CardModal from "./Message/cardModal";
import HintNotification from "./Message/hintNotification";
import Magics from "./PlayMat/magics";
import Field from "./PlayMat/field";
import CommonDeck from "./PlayMat/deck";
import Exclusion from "./PlayMat/exclusion";
import Cemeteries from "./PlayMat/cemetery";
import CardListModal from "./Message/cardListModal";
import CheckCardModal from "./Message/checkCardModal";
import YesNoModal from "./Message/yesNoModal";
import PositionModal from "./Message/positionModal";
import OptionModal from "./Message/optionModal";
import Phase from "./Message/phase";
import CheckCardModalV2 from "./Message/checkCardModalV2";
import ExtraDeck from "./PlayMat/extraDeck";
import NeosLayout from "./layout";
import NeosConfig from "../../../neos.config.json";
import DuelTimeLine from "./Message/timeLine";
import { Row } from "antd";
import SendBox from "./Message/sendBox";
import PlayerStatus from "./Message/status";
import Alert from "./Message/alert";
import CheckCardModalV3 from "./Message/checkCardModalV3";
import CheckCounterModal from "./Message/checkCounterModal";
import SortCardModal from "./Message/sortCardModal";

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
            <Cemeteries />
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

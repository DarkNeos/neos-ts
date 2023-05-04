import React from "react";

import {
  Alert,
  AnnounceModal,
  CardListModal,
  CardModal,
  CheckCounterModal,
  HintNotification,
  OptionModal,
  PositionModal,
  SelectActionsModal,
  SortCardModal,
  YesNoModal,
} from "./Message";
import Mat from "./PlayMat";

import { Mat as NewMat } from "./NewPlayMat";
import { Menu } from "./NewPlayMat/Menu";

const NeosDuel = () => {
  return (
    <>
      <Alert />
      {/* <Test /> */}
      {/* <Mat /> */}
      <Menu />
      <NewMat />
      <CardModal />
      <CardListModal />
      <HintNotification />
      <SelectActionsModal />
      <YesNoModal />
      <PositionModal />
      <OptionModal />
      <CheckCounterModal />
      <SortCardModal />
      <AnnounceModal />
    </>
  );
};

export default NeosDuel;

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
import { LifeBar, Mat, Menu } from "./PlayMat";

const NeosDuel = () => {
  return (
    <>
      <SelectActionsModal />
      <Alert />
      <Menu />
      <LifeBar />
      <Mat />
      <CardModal />
      <CardListModal />
      <HintNotification />
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

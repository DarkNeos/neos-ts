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
  SimpleSelectCardsModal,
  SortCardModal,
  YesNoModal,
} from "./Message";
import { LifeBar, Mat, Menu, Timer } from "./PlayMat";

const NeosDuel = () => {
  return (
    <>
      <SelectActionsModal />
      <Alert />
      <Menu />
      <LifeBar />
      <Mat />
      <Timer />
      <CardModal />
      <CardListModal />
      <HintNotification />
      <YesNoModal />
      <PositionModal />
      <OptionModal />
      <CheckCounterModal />
      <SortCardModal />
      <AnnounceModal />
      <SimpleSelectCardsModal />
    </>
  );
};

export default NeosDuel;

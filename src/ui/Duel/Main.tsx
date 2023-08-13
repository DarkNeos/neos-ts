import React from "react";

import {
  Alert,
  AnnounceModal,
  CardListModal,
  CardModal,
  CheckCounterModal,
  EndModal,
  HintNotification,
  OptionModal,
  PositionModal,
  SelectActionsModal,
  SimpleSelectCardsModal,
  SortCardModal,
  YesNoModal,
} from "./Message";
import { LifeBar, Mat, Menu, Underlying } from "./PlayMat";

export const Component: React.FC = () => {
  return (
    <>
      <Underlying />
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
      <SimpleSelectCardsModal />
      <EndModal />
    </>
  );
};
Component.displayName = "NeosDuel";

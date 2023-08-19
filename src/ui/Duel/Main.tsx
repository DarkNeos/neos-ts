import React, { useEffect } from "react";

import { resetUniverse } from "@/stores";

import { ChangeSideModal, TpModal } from "../Side";
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
  useEffect(() => {
    return () => {
      // Duel组件卸载的时候初始化一些store
      resetUniverse();
    };
  }, []);

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
      <ChangeSideModal />
      <TpModal />
    </>
  );
};
Component.displayName = "NeosDuel";

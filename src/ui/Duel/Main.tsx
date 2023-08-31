import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { SideStage, sideStore } from "@/stores";

import {
  Alert,
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
  const { stage } = useSnapshot(sideStore);
  const navigate = useNavigate();

  useEffect(() => {
    if (stage === SideStage.SIDE_CHANGING) {
      // 跳转更换Side
      navigate("/side");
    }
  }, [stage]);

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
      <SimpleSelectCardsModal />
      <EndModal />
    </>
  );
};
Component.displayName = "NeosDuel";

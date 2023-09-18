import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { matStore, SideStage, sideStore } from "@/stores";

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
import { ChatBox } from "./PlayMat/ChatBox";

export const Component: React.FC = () => {
  const { stage } = useSnapshot(sideStore);
  const { duelEnd } = useSnapshot(matStore);
  const navigate = useNavigate();

  useEffect(() => {
    if (stage === SideStage.SIDE_CHANGING) {
      // 跳转更换Side
      navigate("/side");
    }
  }, [stage]);

  useEffect(() => {
    if (duelEnd) {
      // 决斗结束，返回匹配页
      navigate("/match");
    }
  }, [duelEnd]);

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
      <ChatBox />
    </>
  );
};
Component.displayName = "NeosDuel";

import React, { useEffect } from "react";
import { LoaderFunction, useNavigate, useSearchParams } from "react-router-dom";
import { useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { useEnv } from "@/hook";
import { AudioActionType, changeScene } from "@/infra/audio";
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
import { AnnounceModal } from "./Message/AnnounceModal";
import { LifeBar, Mat, Menu, Underlying } from "./PlayMat";
import { ChatBox } from "./PlayMat/ChatBox";
import { HandChain } from "./PlayMat/HandChain";

export const loader: LoaderFunction = async () => {
  // 更新场景
  changeScene(AudioActionType.BGM_DUEL);
  return null;
};

export const Component: React.FC = () => {
  const { stage } = useSnapshot(sideStore);
  const { duelEnd } = useSnapshot(matStore);
  const navigate = useNavigate();

  // 如果处于开发时的本地文件回放模式，则重新跳回Match且保持record参数，从而开始下一轮播放
  const [searchParams] = useSearchParams();
  const { DEV } = useEnv();

  useEffect(() => {
    if (!DEV) return;
    const recordName = searchParams.get("record");
    if (
      searchParams &&
      matStore.selfType === ygopro.StocTypeChange.SelfType.UNKNOWN
    ) {
      navigate(`/match?record=${recordName}`);
    }
  }, []);

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
      <AnnounceModal />
      <EndModal />
      <ChatBox />
      <HandChain />
    </>
  );
};
Component.displayName = "NeosDuel";

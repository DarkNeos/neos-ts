import React, { useEffect } from "react";
import { LoaderFunction, useNavigate, useSearchParams } from "react-router-dom";
import { useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { useEnv } from "@/hook";
import { AudioActionType, changeScene } from "@/infra/audio";
import {
  matStore,
  resetUniverse,
  SideStage,
  sideStore,
  trainingStore,
} from "@/stores";
import { disconnectSession } from "@/ui/Match/util";

import {
  ActionHistory,
  Alert,
  AnnounceModal,
  CardListModal,
  CardModal,
  CheckCounterModal,
  ConfirmCardsModal,
  EndModal,
  HintNotification,
  OptionModal,
  PositionModal,
  SelectActionsModal,
  SimpleSelectCardsModal,
  SortCardModal,
  YesNoModal,
} from "./Message";
import { ChatBox, LifeBar, Mat, Menu, Underlying } from "./PlayMat";
import { ChainCards } from "./PlayMat/ChainCards";
import { FieldSelection } from "./PlayMat/FieldSelection";
import { LifeChange } from "./PlayMat/LifeChange";
import { PhaseBanner } from "./PlayMat/PhaseBanner";

export const loader: LoaderFunction = async () => {
  // 更新场景
  changeScene(AudioActionType.BGM_DUEL);
  return null;
};

export const Component: React.FC = () => {
  const { stage } = useSnapshot(sideStore);
  const { duelEnd } = useSnapshot(matStore);
  const { savingReplay } = useSnapshot(trainingStore);
  const navigate = useNavigate();

  // 如果处于开发时的本地文件回放模式，则重新跳回Match且保持record参数，从而开始下一轮播放
  const [searchParams] = useSearchParams();
  const { DEV } = useEnv();
  const RECORD = "record";

  useEffect(() => {
    if (!DEV) return;
    const recordName = searchParams.get(RECORD);
    if (
      recordName &&
      matStore.selfType === ygopro.StocTypeChange.SelfType.UNKNOWN
    ) {
      navigate(`/match?${new URLSearchParams({ [RECORD]: recordName })}`);
    }
  }, []);

  useEffect(() => {
    if (stage === SideStage.SIDE_CHANGING) {
      // 跳转更换Side
      navigate("/side");
    }
  }, [stage]);

  useEffect(() => {
    // 保存退出需等待服务器录像；保存流程负责下载和离开，避免提前清空对局记录。
    if (duelEnd && !savingReplay) {
      // 训练结束后回到原编辑内容，替换历史记录以免返回已经结束的对局。
      if (trainingStore.session) {
        disconnectSession();
        resetUniverse();
        navigate("/build", { replace: true });
        return;
      }
      // 决斗结束，返回匹配页
      navigate("/match");
    }
  }, [duelEnd, savingReplay]);

  return (
    <>
      <Underlying />
      <SelectActionsModal />
      <Alert />
      <Menu />
      <LifeBar />
      <Mat />
      <ChainCards />
      <LifeChange />
      <PhaseBanner />
      <FieldSelection />
      <CardModal />
      <CardListModal />
      <ConfirmCardsModal />
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
      <ActionHistory />
    </>
  );
};
Component.displayName = "NeosDuel";

import { notification } from "antd";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { useConfig } from "@/config";
import { matStore } from "@/stores";

const MsgWin = ygopro.StocGameMessage.MsgWin;

const NeosConfig = useConfig();
export const HintNotification = () => {
  const hintState = matStore.hint;
  const hintSnap = useSnapshot(matStore.hint);

  const currentPhase = matStore.phase.currentPhase;
  const waiting = matStore.waiting;
  const result = matStore.result;

  const navigate = useNavigate();

  const [api, contextHolder] = notification.useNotification({
    maxCount: NeosConfig.ui.hint.maxCount,
  });
  useEffect(() => {
    if (hintState && hintState.msg) {
      api.info({
        message: `${hintState.msg}`,
        placement: "bottom",
      });
    }
  }, [hintSnap?.msg]);

  useEffect(() => {
    if (currentPhase) {
      api.info({
        message: `<当前阶段>${currentPhase}`,
        placement: "topRight",
      });
    }
  }, [currentPhase]);

  useEffect(() => {
    if (waiting) {
      api.info({
        message: "...等待对方行动中...",
        placement: "top",
        duration: NeosConfig.ui.hint.waitingDuration,
      });
    }
  }, [waiting]);

  useEffect(() => {
    if (result) {
      const message =
        result == MsgWin.ActionType.Win
          ? "胜利"
          : MsgWin.ActionType.Defeated
          ? "失败"
          : "未知结果";
      api.info({
        message,
        placement: "bottom",
        onClose() {
          navigate("/");
        },
      });
    }
  }, [result]);

  return <>{contextHolder}</>;
};

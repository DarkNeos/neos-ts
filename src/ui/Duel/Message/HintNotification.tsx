import { notification } from "antd";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { useAppSelector } from "@/hook";
import { selectHint } from "@/reducers/duel/hintSlice";
import { selectDuelResult, selectWaiting } from "@/reducers/duel/mod";
import { selectCurrentPhase } from "@/reducers/duel/phaseSlice";
import MsgWin = ygopro.StocGameMessage.MsgWin;
import NeosConfig from "../../../../neos.config.json";

export const HintNotification = () => {
  const hint = useAppSelector(selectHint);
  const currentPhase = useAppSelector(selectCurrentPhase);
  const waiting = useAppSelector(selectWaiting);
  const result = useAppSelector(selectDuelResult);
  const navigate = useNavigate();

  const [api, contextHolder] = notification.useNotification({
    maxCount: NeosConfig.ui.hint.maxCount,
  });
  useEffect(() => {
    if (hint && hint.msg) {
      api.info({
        message: `${hint.msg}`,
        placement: "bottom",
      });
    }
  }, [hint?.msg]);

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

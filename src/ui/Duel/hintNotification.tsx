import React, { useEffect } from "react";
import { useAppSelector } from "../../hook";
import { selectMeHint, selectOpHint } from "../../reducers/duel/hintSlice";
import { selectCurrentPhase } from "../../reducers/duel/phaseSlice";
import { notification } from "antd";
import { selectDuelResult, selectWaiting } from "../../reducers/duel/mod";
import { useNavigate } from "react-router-dom";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import MsgWin = ygopro.StocGameMessage.MsgWin;
import NeosConfig from "../../../neos.config.json";

const HintNotification = () => {
  const meHint = useAppSelector(selectMeHint);
  const opHint = useAppSelector(selectOpHint);
  const currentPhase = useAppSelector(selectCurrentPhase);
  const waiting = useAppSelector(selectWaiting);
  const result = useAppSelector(selectDuelResult);
  const navigate = useNavigate();

  const [api, contextHolder] = notification.useNotification({
    maxCount: NeosConfig.ui.hint.maxCount,
  });
  useEffect(() => {
    if (meHint && meHint.msg) {
      api.info({
        message: `<我方>${meHint.msg}`,
        placement: "bottom",
      });
    }
  }, [meHint?.msg]);

  useEffect(() => {
    if (opHint && opHint.msg) {
      api.info({
        message: `<对方>${opHint.msg}`,
        placement: "top",
      });
    }
  }, [opHint?.msg]);

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

export default HintNotification;

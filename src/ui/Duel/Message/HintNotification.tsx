import { notification } from "antd";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { fetchStrings, ygopro } from "@/api";
import { Phase2StringCodeMap } from "@/common";
import { useConfig } from "@/config";
import { matStore } from "@/stores";

const style = {
  borderStyle: "groove",
  borderRadius: "8px",
  backgroundColor: "#303030",
};

const MsgWin = ygopro.StocGameMessage.MsgWin;

const NeosConfig = useConfig();
export const HintNotification = () => {
  const snap = useSnapshot(matStore);
  const hintState = snap.hint;

  const currentPhase = snap.phase.currentPhase;
  const waiting = snap.waiting;
  const result = snap.result;

  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification({
    maxCount: NeosConfig.ui.hint.maxCount,
  });
  useEffect(() => {
    if (hintState && hintState.msg) {
      api.open({
        message: `${hintState.msg}`,
        placement: "topLeft",
        style: style,
      });
    }
  }, [hintState.msg]);

  useEffect(() => {
    if (currentPhase) {
      api.open({
        message: fetchStrings(
          "!system",
          Phase2StringCodeMap.get(currentPhase) ?? 0
        ),
        placement: "topRight",
        style: style,
      });
    }
  }, [currentPhase]);

  useEffect(() => {
    if (waiting) {
      api.open({
        message: fetchStrings("!system", 1390),
        placement: "top",
        duration: NeosConfig.ui.hint.waitingDuration,
        style: style,
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
      api.open({
        message,
        placement: "bottom",
        style: style,
        onClose() {
          navigate("/");
        },
      });
    }
  }, [result]);

  return <>{contextHolder}</>;
};

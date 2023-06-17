import { notification } from "antd";
import React, { useEffect } from "react";
import { useSnapshot } from "valtio";

import { fetchStrings } from "@/api";
import { Phase2StringCodeMap } from "@/common";
import { useConfig } from "@/config";
import { matStore } from "@/stores";

const style = {
  borderStyle: "groove",
  borderRadius: "8px",
  backgroundColor: "#303030",
};

const NeosConfig = useConfig();
export const HintNotification = () => {
  const snap = useSnapshot(matStore);
  const hintState = snap.hint;
  const toss = snap.tossResult;

  const currentPhase = snap.phase.currentPhase;
  const waiting = snap.waiting;
  const result = snap.result;

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
    if (toss) {
      api.open({
        message: `${toss}`,
        placement: "topLeft",
        style: style,
      });
    }
  }, [toss]);

  useEffect(() => {
    if (currentPhase) {
      const message = fetchStrings(
        "!system",
        Phase2StringCodeMap.get(currentPhase) ?? 0
      );
      api.open({
        message,
        placement: "topRight",
        style: style,
      });
      console.color("DeepPink")(
        `${message}(${matStore.isMe(matStore.currentPlayer) ? "me" : "op"})`
      );
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
      const message = result.isWin ? "Win" : "Defeated" + " " + result.reason;
      api.open({
        message,
        placement: "bottom",
        style: style,
      });
    }
  }, [result]);

  return <>{contextHolder}</>;
};

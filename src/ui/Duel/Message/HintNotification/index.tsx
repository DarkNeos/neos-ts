import { message, notification } from "antd";
import React, { useEffect } from "react";
import { useSnapshot } from "valtio";

import { fetchStrings } from "@/api";
import { Phase2StringCodeMap } from "@/common";
import { useConfig } from "@/config";
import { matStore } from "@/stores";
import "./index.scss";

const style = {
  borderStyle: "groove",
  borderRadius: "8px",
  backgroundColor: "#303030",
};

const NeosConfig = useConfig();

let globalMsgApi: ReturnType<typeof message.useMessage>[0] | undefined;
export const HintNotification = () => {
  const snap = useSnapshot(matStore);
  const hintState = snap.hint;
  const toss = snap.tossResult;

  const currentPhase = snap.phase.currentPhase;
  // const waiting = snap.waiting;
  const result = snap.result;

  const [notify, notifyContextHolder] = notification.useNotification({
    maxCount: NeosConfig.ui.hint.maxCount,
  });
  const [msgApi, msgContextHolder] = message.useMessage({
    maxCount: NeosConfig.ui.hint.maxCount,
  });
  globalMsgApi = msgApi;
  useEffect(() => {
    if (hintState && hintState.msg) {
      notify.open({
        message: `${hintState.msg}`,
        placement: "topLeft",
        style: style,
      });
    }
  }, [hintState.msg]);

  useEffect(() => {
    if (toss) {
      notify.open({
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
      notify.open({
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
    if (result) {
      const message = result.isWin ? "Win" : "Defeated" + " " + result.reason;
      notify.open({
        message,
        placement: "bottom",
        style: style,
      });
    }
  }, [result]);

  return (
    <>
      {notifyContextHolder}
      {msgContextHolder}
    </>
  );
};

// 防抖的waiting msg
let isWaiting = false;
let destoryTimer: NodeJS.Timeout | undefined;
const waitingKey = "waiting";
export const showWaiting = (open: boolean) => {
  if (open) {
    if (!isWaiting) {
      globalMsgApi?.open({
        type: "loading",
        content: fetchStrings("!system", 1390),
        key: waitingKey,
        className: "neos-message",
        duration: 0,
      });
      clearTimeout(destoryTimer);
      isWaiting = true;
      destoryTimer = undefined;
    }
  } else {
    if (!destoryTimer) {
      destoryTimer = setTimeout(() => {
        globalMsgApi?.destroy(waitingKey);
        isWaiting = false;
      }, 1000);
    }
  }
};

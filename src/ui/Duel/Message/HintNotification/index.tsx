import "./index.scss";

import { message, notification } from "antd";
import React, { useEffect } from "react";
import { useSnapshot } from "valtio";

import { fetchStrings } from "@/api";
import { Phase2StringCodeMap } from "@/common";
import { useConfig } from "@/config";
import { HandResult, matStore } from "@/stores";

const style = {
  // borderStyle: "groove",
  // borderRadius: "8px",
  backgroundColor: "#444",
};

const NeosConfig = useConfig();

let globalMsgApi: ReturnType<typeof message.useMessage>[0] | undefined;
export const HintNotification = () => {
  const snap = useSnapshot(matStore);
  const hintState = snap.hint;
  const toss = snap.tossResult;
  const handResults = snap.handResults;
  const currentPhase = snap.phase.currentPhase;

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

  // TODO: I18n
  useEffect(() => {
    const meHand = handResults.me;
    const opHand = handResults.op;
    if (meHand !== HandResult.UNKNOWN && opHand !== HandResult.UNKNOWN) {
      notify.open({
        message: `{我方出示${getHandResultText(
          meHand
        )}，对方出示${getHandResultText(opHand)}}`,
        placement: "topLeft",
        style: style,
      });
    }
  }, [handResults]);

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

// TODO: I18n
function getHandResultText(res: HandResult): string {
  switch (res) {
    case HandResult.UNKNOWN:
      return "[?]";
    case HandResult.ROCK:
      return "拳头";
    case HandResult.PAPER:
      return "布";
    case HandResult.SCISSOR:
      return "剪刀";
  }
}

import { MessageOutlined } from "@ant-design/icons";
import { message, notification } from "antd";
import React, { useEffect } from "react";
import { useSnapshot } from "valtio";

import { fetchStrings, Region } from "@/api";
import { Phase2StringCodeMap } from "@/common";
import { useConfig } from "@/config";
import { HandResult, matStore } from "@/stores";
import { useChat } from "@/ui/Shared";

import styles from "./index.module.scss";

const NeosConfig = useConfig();

let globalMsgApi: ReturnType<typeof message.useMessage>[0] | undefined;
export const HintNotification = () => {
  const matSnap = useSnapshot(matStore);
  const hintState = matSnap.hint;
  const toss = matSnap.tossResult;
  const handResults = matSnap.handResults;
  const currentPhase = matSnap.phase.currentPhase;
  const error = matSnap.error;

  const { dialogs } = useChat(true);
  const [msgApi, msgContextHolder] = message.useMessage({
    maxCount: NeosConfig.ui.hint.maxCount,
  });
  const [notiApi, notiContextHolder] = notification.useNotification({
    maxCount: NeosConfig.ui.hint.maxCount,
  });

  globalMsgApi = msgApi;
  useEffect(() => {
    if (hintState && hintState.msg) {
      msgApi.info(`${hintState.msg}`);
    }
  }, [hintState.msg]);

  useEffect(() => {
    if (toss) {
      msgApi.info(`${toss}`);
    }
  }, [toss]);

  // TODO: I18n
  useEffect(() => {
    const meHand = handResults.me;
    const opHand = handResults.op;
    if (meHand !== HandResult.UNKNOWN && opHand !== HandResult.UNKNOWN) {
      msgApi.info(
        `{我方出示${getHandResultText(meHand)}，对方出示${getHandResultText(
          opHand,
        )}}`,
      );
    }
  }, [handResults]);

  useEffect(() => {
    if (currentPhase) {
      const message = fetchStrings(
        Region.System,
        Phase2StringCodeMap.get(currentPhase) ?? 0,
      );
      msgApi.info(message);
      console.color("DeepPink")(
        `${message}(${matStore.isMe(matStore.currentPlayer) ? "me" : "op"})`,
      );
    }
  }, [currentPhase]);

  useEffect(() => {
    if (error !== "") {
      msgApi.error(error);
    }
  }, [error]);

  useEffect(() => {
    const latest = dialogs.at(-1);
    if (latest) {
      notiApi.open({
        message: latest.name,
        description: latest.content,
        icon: <MessageOutlined />,
      });
    }
  }, [dialogs]);

  return (
    <>
      {msgContextHolder}
      {notiContextHolder}
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
        content: fetchStrings(Region.System, 1390),
        key: waitingKey,
        className: styles["message"],
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

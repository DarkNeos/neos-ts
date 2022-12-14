import React, { useEffect } from "react";
import { useAppSelector } from "../../hook";
import { selectMeHint, selectOpHint } from "../../reducers/duel/hintSlice";
import { selectCurrentPhase } from "../../reducers/duel/phaseSlice";
import { selectChat } from "../../reducers/chatSlice";
import { notification } from "antd";

const HintNotification = () => {
  const meHint = useAppSelector(selectMeHint);
  const opHint = useAppSelector(selectOpHint);
  const currentPhase = useAppSelector(selectCurrentPhase);
  const chat = useAppSelector(selectChat);

  const [api, contextHolder] = notification.useNotification();
  useEffect(() => {
    if (meHint && meHint.msg) {
      api.info({
        message: `<我方>${meHint.msg}`,
        placement: "bottom",
      });
    }
  }, [meHint]);

  useEffect(() => {
    if (opHint && opHint.msg) {
      api.info({
        message: `<对方>${opHint.msg}`,
        placement: "top",
      });
    }
  }, [opHint]);

  useEffect(() => {
    if (currentPhase) {
      api.info({
        message: `<当前阶段>${currentPhase}`,
        placement: "topRight",
      });
    }
  }, [currentPhase]);

  useEffect(() => {
    if (chat !== "") {
      api.info({
        message: "Chat",
        description: chat,
        placement: "topLeft",
      });
    }
  }, [chat]);

  return <>{contextHolder}</>;
};

export default HintNotification;

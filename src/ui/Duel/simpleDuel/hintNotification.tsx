import React, { useEffect } from "react";
import { useAppSelector } from "../../../hook";
import { selectMeHint, selectOpHint } from "../../../reducers/duel/hint";
import { notification } from "antd";

const HintNotification = () => {
  const meHint = useAppSelector(selectMeHint);
  const opHint = useAppSelector(selectOpHint);

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

  return <>{contextHolder}</>;
};

export default HintNotification;

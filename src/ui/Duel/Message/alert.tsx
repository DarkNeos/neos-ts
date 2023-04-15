import { Alert as AntdAlert } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";

import { sendSurrender } from "@/api/ocgcore/ocgHelper";
import { useAppSelector } from "@/hook";
import { selectUnimplemented } from "@/reducers/duel/mod";

export const Alert = () => {
  const unimplemented = useAppSelector(selectUnimplemented);
  const navigate = useNavigate();

  return (
    <>
      {unimplemented ? (
        <AntdAlert
          message={`Unimplemented message with code=${unimplemented}`}
          description="It seems that there's something unimplemented by Neos. Sincerely apologize for that. Contact use to fix this issue: <ccc@neos.moe>"
          showIcon
          type="error"
          closable
          banner
          afterClose={() => {
            // 发送投降信号
            sendSurrender();
            navigate("/");
          }}
        />
      ) : (
        <></>
      )}
    </>
  );
};

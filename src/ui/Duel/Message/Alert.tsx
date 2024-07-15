import { Alert as AntdAlert } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { sendSurrender } from "@/api";
import { getUIContainer } from "@/container/compat";
import { matStore } from "@/stores";

export const Alert = () => {
  const matSnap = useSnapshot(matStore);
  const unimplemented = matSnap.unimplemented;
  const container = getUIContainer();

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
            sendSurrender(container.conn);
            navigate("/match");
          }}
        />
      ) : (
        <></>
      )}
    </>
  );
};

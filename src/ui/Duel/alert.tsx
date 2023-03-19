import React from "react";
import { useNavigate } from "react-router-dom";
import { sendSurrender } from "../../api/ocgcore/ocgHelper";
import { useAppSelector } from "../../hook";
import { selectUnimplemented } from "../../reducers/duel/mod";
import { Alert } from "antd";

const NeosAlert = () => {
  const unimplemented = useAppSelector(selectUnimplemented);
  const navigate = useNavigate();

  return (
    <>
      {unimplemented ? (
        <Alert
          message={`Unimplemented message with code=${unimplemented}`}
          description="It seems that there's something unimplemented by Neos. Sincerely apologize for that. Contact use to fix this issue: <linuxgnulover@gmail.com>"
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

export default NeosAlert;

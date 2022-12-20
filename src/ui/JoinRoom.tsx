/*
 * 加入房间页面
 *
 * player: 玩家昵称；
 * addr: IP地址；
 * passWd: 房间密码。
 *
 * */
import React, { useState, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import "../css/JoinRoom.css";
import { Input, Button } from "antd";

export default function JoinRoom() {
  const [player, setPlayer] = useState("");
  const [passWd, setPasswd] = useState("");
  const [ip, setIp] = useState("");

  let handlePlayerChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPlayer(event.target.value);
  };
  let handlePasswdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPasswd(event.target.value);
  };
  let handleIpChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIp(event.target.value);
  };

  return (
    <div className="login_div">
      <p className="login_p">
        <Input
          type="text"
          style={{ width: "20%" }}
          placeholder="player"
          value={player}
          onChange={handlePlayerChange}
        />
      </p>
      <p className="login_p">
        <Input
          type="text"
          style={{ width: "20%" }}
          placeholder="ip"
          value={ip}
          onChange={handleIpChange}
        />
      </p>
      <p className="login_p">
        <Input
          type="text"
          style={{ width: "20%" }}
          placeholder="passwd"
          value={passWd}
          onChange={handlePasswdChange}
        />
      </p>
      <p className="login_p">
        <Button>
          <Link to={{ pathname: `/${player}/${passWd}/${ip}` }}>join</Link>
        </Button>
      </p>
    </div>
  );
}

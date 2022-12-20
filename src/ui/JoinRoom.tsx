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
        <label>player: </label>
        <input
          type="text"
          title="player"
          value={player}
          onChange={handlePlayerChange}
        ></input>
      </p>
      <p className="login_p">
        <label>addr: </label>
        <input
          type="text"
          title="ip"
          value={ip}
          onChange={handleIpChange}
        ></input>
      </p>
      <p className="login_p">
        <label>passwd: </label>
        <input
          type="text"
          title="passwd"
          value={passWd}
          onChange={handlePasswdChange}
        ></input>
      </p>
      <p className="login_p">
        <button>
          <Link to={{ pathname: `/${player}/${passWd}/${ip}` }}>join</Link>
        </button>
      </p>
    </div>
  );
}

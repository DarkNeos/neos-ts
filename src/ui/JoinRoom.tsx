/*
 * 加入房间页面
 *
 * player: 玩家昵称；
 * addr: IP地址；
 * passWd: 房间密码。
 *
 * */
import { Input } from "antd";
import React, { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/core.scss";

export default function JoinRoom() {
  const [player, setPlayer] = useState("");
  const [passWd, setPasswd] = useState("");
  const [ip, setIp] = useState("");
  const navigate = useNavigate();

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
    <div className="container">
      <div id="login">
        <form
          className="login-form"
          onSubmit={() => navigate(`/${player}/${passWd}/${ip}`)}
        >
          <span className="fa fa-user"></span>
          <Input
            autoFocus
            type="text"
            placeholder="Player Name"
            value={player}
            onChange={handlePlayerChange}
            required
          />
          <span className="fa fa-user"></span>
          <Input
            type="text"
            placeholder="Ip And Port"
            value={ip}
            onChange={handleIpChange}
            required
          />
          <span className="fa fa-lock"></span>
          <Input
            type="password"
            autoCorrect="off"
            placeholder="Room Password"
            value={passWd}
            onChange={handlePasswdChange}
            required
          />
          <Input type="submit" value="Enter Room" />
        </form>
      </div>
      <div className="sign-up__actions clearfix">
        <p>
          Don't know how to play? <a href="/sign-up">Player Guide</a>
          <span className="fa fa-arrow-right"></span>
        </p>
      </div>
      <div className="sign-in__actions clearfix">
        <ul>
          <li>
            <a
              href="https://github.com/DarkNeos/neos-ts"
              className="link link-github"
            ></a>
          </li>
          <li>
            <a
              href="https://code.mycard.moe/mycard/Neos"
              className="fa-brands fa-gitlab"
            ></a>
          </li>
          <li>
            <a onClick={() => {}} className="link link-facebook"></a>
          </li>
        </ul>
      </div>
    </div>
  );
}

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
import NeosConfig from "../../neos.config.json";

const serverConfig = NeosConfig.servers;

export default function Login() {
  const [player, setPlayer] = useState("");
  const [passWd, setPasswd] = useState("");
  const [ip, setIp] = useState(`${serverConfig[0].ip}:${serverConfig[0].port}`);
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
          onSubmit={() => navigate(`/room/${player}/${passWd}/${ip}`)}
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
          <span className="fa-solid fa-server"></span>
          <Input
            type="text"
            placeholder="Server"
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
          Don't know how to play?{" "}
          <a href="https://neos.moe/doc/">Player Guide</a>
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
            <a href="https://mycard.moe/">
              <img
                src={`${NeosConfig.assetsPath}/mycard.icon.png`}
                style={{ width: "25%" }}
              />
            </a>
          </li>
          <li>
            <a className="fa-brands fa-discord"></a>
          </li>
        </ul>
      </div>
    </div>
  );
}

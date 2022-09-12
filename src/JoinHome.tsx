import React, { useState, useEffect, ChangeEvent, useRef } from "react";
import { ygopro } from "./api/ocgcore";

export default function JoinHome(props: { addr: string }) {
  const ws = useRef<WebSocket | null>(null);
  const [userName, setUsername] = useState("");
  const [passWd, setPasswd] = useState("");
  const [isJoined, setJoined] = useState(false);

  useEffect(() => {
    if (!ws.current) {
      ws.current = new WebSocket(props.addr);
    }

    ws.current.onopen = () => {
      console.log("websocket open");
    };

    ws.current.onclose = () => {
      console.log("websocket closed");
    };

    ws.current.onmessage = (e) => {
      console.log("websocket read message: " + e.data);
    };

    const wsCurrent = ws.current;

    return () => {
      if (wsCurrent.readyState == 1) {
        wsCurrent.close();
      }
    };
  }, [ws]);

  let handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  let handlePasswdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPasswd(event.target.value);
  };

  let handleButtonOnClick = () => {
    if (!ws.current) {
      console.error("websocket not connected");
    } else {
      const wsCurrent = ws.current;

      if (
        userName != null &&
        userName.length != 0 &&
        passWd != null &&
        passWd.length != 0
      ) {
        console.log(
          "ready to send playerInfo and joinGame packet, userName=" +
            userName +
            ", passWd=" +
            passWd
        );
        const playerInfo = new ygopro.YgoCtosMsg({
          ctos_player_info: new ygopro.CtosPlayerInfo({
            name: userName,
          }),
        });

        wsCurrent.send(playerInfo.serialize());

        const joinGame = new ygopro.YgoCtosMsg({
          ctos_join_game: new ygopro.CtosJoinGame({
            version: 4947,
            gameid: 0,
            passwd: passWd,
          }),
        });

        wsCurrent.send(joinGame.serialize());
      }
    }
  };

  return (
    <div>
      <p>
        <input
          type="text"
          title="username"
          value={userName}
          onChange={handleUsernameChange}
        ></input>
      </p>
      <p>
        <input
          type="text"
          title="passwd"
          value={passWd}
          onChange={handlePasswdChange}
        ></input>
      </p>
      <button onClick={handleButtonOnClick}>Join</button>
      <p>{"isJoined: " + isJoined}</p>
    </div>
  );
}

import React, { useState, useEffect, ChangeEvent, useRef } from "react";
import { ygopro } from "./api/ocgcore";

export default function JoinHome(props: { addr: string }) {
  const ws = useRef<WebSocket | null>(null);
  const [username, setUsername] = useState("");
  const [passwd, setPasswd] = useState("");
  const [isJoined, setJoined] = useState(false);

  useEffect(() => {
    ws.current = new WebSocket(props.addr);

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
        wsCurrent.close()
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
    console.log("buttom clicked");

    if (!ws.current) {
      console.error("websocket not connected");
    } else {
      const wsCurrent = ws.current;

      // todo
    }
  };

  return (
    <div>
      <p>
        <input
          type="text"
          title="username"
          value={username}
          onChange={handleUsernameChange}
        ></input>
      </p>
      <p>
        <input
          type="text"
          title="passwd"
          value={passwd}
          onChange={handlePasswdChange}
        ></input>
      </p>
      <button onClick={handleButtonOnClick}>Join</button>
      <p>{"isJoined: " + isJoined}</p>
    </div>
  );
}

import React, { useState, ChangeEvent } from "react";
import { Link } from "react-router-dom";

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
    <div>
      <p>
        <input
          type="text"
          title="player"
          value={player}
          onChange={handlePlayerChange}
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
      <p>
        <input
          type="text"
          title="ip"
          value={ip}
          onChange={handleIpChange}
        ></input>
      </p>
      <button>
        <Link to={{ pathname: `/${player}/${passWd}/${ip}` }}>join</Link>
      </button>
    </div>
  );
}

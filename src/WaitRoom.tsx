import React, { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ygopro } from "./api/ocgcore";

export default function WaitRoom() {
  const params = useParams<{
    player?: string;
    passWd?: string;
    ip?: string;
  }>();

  const ws = useRef<WebSocket | null>(null);

  const { player, passWd, ip } = params;
  useEffect(() => {
    if (!ws.current) {
      ws.current = new WebSocket("ws://" + ip);
    }

    ws.current.onopen = () => {
      console.log("websocket open");

      if (
        player != null &&
        player.length != 0 &&
        passWd != null &&
        passWd.length != 0 &&
        ws.current
      ) {
        const wsCurrent = ws.current;

        const playerInfo = new ygopro.YgoCtosMsg({
          ctos_player_info: new ygopro.CtosPlayerInfo({
            name: player
          })
        });

        wsCurrent.send(playerInfo.serialize());

        const joinGame = new ygopro.YgoCtosMsg({
          ctos_join_game: new ygopro.CtosJoinGame({
            version: 4947, // todo: use config
            gameid: 0,
            passwd: passWd
          })
        });

        wsCurrent.send(joinGame.serialize());
      }
    };

    ws.current.onclose = () => {
      console.log("websocket closed");
    };

    ws.current.onmessage = e => {
      console.log("websocket read message: " + e.data);
    };

    const wsCurrent = ws.current;

    return () => {
      if (wsCurrent.readyState == 1) {
        wsCurrent.close();
      }
    };
  }, [ws]);

  return (
    <div>
      <p>player: {params.player}</p>
      <p>passwd: {params.passWd}</p>
      <p>ip: {params.ip}</p>
    </div>
  );
}

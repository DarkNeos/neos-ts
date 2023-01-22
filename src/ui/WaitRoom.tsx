/*
 * 等待房间页面
 *
 * */
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchDeck } from "../api/deck";
import "../css/WaitRoom.css";
import { useAppSelector } from "../hook";
import { selectJoined } from "../reducers/joinSlice";
import { selectChat } from "../reducers/chatSlice";
import {
  selectIsHost,
  selectPlayer0,
  selectPlayer1,
  selectObserverCount,
} from "../reducers/playerSlice";
import {
  sendUpdateDeck,
  sendHsReady,
  sendHsStart,
} from "../api/ocgcore/ocgHelper";
import socketMiddleWare, { socketCmd } from "../middleware/socket";
import sqliteMiddleWare, { sqliteCmd } from "../middleware/sqlite";
import { Button } from "antd";

const READY_STATE = "ready";

export default function WaitRoom() {
  const params = useParams<{
    player?: string;
    passWd?: string;
    ip?: string;
  }>();

  const [choseDeck, setChoseDeck] = useState<boolean>(false);
  const { player, passWd, ip } = params;

  useEffect(() => {
    if (ip && player && player.length != 0 && passWd && passWd.length != 0) {
      // 页面第一次渲染时，通过socket中间件向ygopro服务端请求建立长连接
      socketMiddleWare({
        cmd: socketCmd.CONNECT,
        initInfo: {
          ip,
          player,
          passWd,
        },
      });
    }

    // 初始化sqlite
    sqliteMiddleWare({
      cmd: sqliteCmd.INIT,
      initInfo: { dbUrl: "/ygopro-database/locales/zh-CN/cards.cdb" },
    });
  }, []);

  const joined = useAppSelector(selectJoined);
  const chat = useAppSelector(selectChat);
  const isHost = useAppSelector(selectIsHost);
  const player0 = useAppSelector(selectPlayer0);
  const player1 = useAppSelector(selectPlayer1);
  const observerCount = useAppSelector(selectObserverCount);

  const handleChoseDeck = async () => {
    const deck = await fetchDeck("hero.ydk");

    sendUpdateDeck(deck);

    setChoseDeck(true);
  };

  const handleChoseReady = () => {
    sendHsReady();
  };

  const handleChoseStart = () => {
    sendHsStart();
  };

  return (
    <div className="container">
      <div className="playerRegion">
        <h2>{joined ? "Room Joined!" : "Room Not Joined."}</h2>
        <p>
          <Button disabled={!joined} onClick={handleChoseDeck}>
            choose hero.ydk
          </Button>
        </p>
        <p>
          <Button disabled={!choseDeck} onClick={handleChoseReady}>
            ready
          </Button>
        </p>
        <p>
          <Button onClick={handleChoseStart}>
            <Link
              to={
                // 若当前玩家是房主并且对战双方都已准备完毕，跳转到猜拳页面；
                // 否则停留在当前页面。
                !isHost ||
                player0.state !== READY_STATE ||
                player1.state !== READY_STATE
                  ? {}
                  : { pathname: `/mora` }
              }
            >
              start
            </Link>
          </Button>
        </p>
      </div>
      <div className="roomRegion">
        <h2>Room Passwd: {passWd}</h2>
        <p>
          player0: {player0.isHost == true ? "[Host]" : ""} {player0.name}{" "}
          {player0.state}
        </p>
        <p>
          player1: {player1.isHost == true ? "[Host]" : ""} {player1.name}{" "}
          {player1.state}
        </p>
        <p>observer: {observerCount}</p>
        <p>chat: {chat}</p>
      </div>
    </div>
  );
}

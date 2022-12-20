/*
 * 猜拳页面
 *
 * */

import React from "react";
import { sendHandResult, sendTpResult } from "../api/ocgcore/ocgHelper";
import "../css/Mora.css";
import { useAppSelector } from "../hook";
import {
  selectHandSelectAble,
  unSelectHandAble,
  selectTpSelectAble,
  unSelectTpAble,
} from "../reducers/moraSlice";
import { selectPlayer0, selectPlayer1 } from "../reducers/playerSlice";
import { selectDuelHsStart } from "../reducers/duel/mod";
import { store } from "../store";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";

// TODO: 应该展示聊天信息
export default function Mora() {
  const dispatch = store.dispatch;
  const selectHandAble = useAppSelector(selectHandSelectAble);
  const selectTpAble = useAppSelector(selectTpSelectAble);
  const player0 = useAppSelector(selectPlayer0);
  const player1 = useAppSelector(selectPlayer1);
  const duelHsStart = useAppSelector(selectDuelHsStart);

  const navigate = useNavigate();

  useEffect(() => {
    // 若对局已经开始，自动跳转
    if (duelHsStart) {
      navigate("/duel");
    }
  }, [duelHsStart]);

  const handleSelectScissors = () => {
    sendHandResult("scissors");
    dispatch(unSelectHandAble());
  };
  const handleSelectRock = () => {
    sendHandResult("rock");
    dispatch(unSelectHandAble());
  };
  const handleSelectPaper = () => {
    sendHandResult("paper");
    dispatch(unSelectHandAble());
  };
  const handleSelectFirst = () => {
    sendTpResult(true);
    dispatch(unSelectTpAble());
  };
  const handleSelectSecond = () => {
    sendTpResult(false);
    dispatch(unSelectTpAble());
  };

  return (
    <div className="container">
      <div className="item">
        <Button disabled={!selectHandAble} onClick={handleSelectScissors}>
          scissors
        </Button>
        <Button disabled={!selectHandAble} onClick={handleSelectRock}>
          rock
        </Button>
        <Button disabled={!selectHandAble} onClick={handleSelectPaper}>
          paper
        </Button>
      </div>
      <div className="item">
        <Button disabled={!selectTpAble} onClick={handleSelectFirst}>
          first
        </Button>
        <Button disabled={!selectTpAble} onClick={handleSelectSecond}>
          second
        </Button>
      </div>
      <div className="item">
        <p>
          Me: main={player0.deckInfo?.mainCnt}, extra=
          {player0.deckInfo?.extraCnt}, side={player0.deckInfo?.sideCnt}
        </p>
        <p>
          Me: main={player1.deckInfo?.mainCnt}, extra=
          {player1.deckInfo?.extraCnt}, side={player1.deckInfo?.sideCnt}
        </p>
      </div>
    </div>
  );
}

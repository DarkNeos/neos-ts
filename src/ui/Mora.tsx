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
import { store } from "../store";

// TODO: 应该展示对手卡组信息和聊天信息
export default function Mora() {
  const dispatch = store.dispatch;
  const selectHandAble = useAppSelector(selectHandSelectAble);
  const selectTpAble = useAppSelector(selectTpSelectAble);

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
        <button disabled={!selectHandAble} onClick={handleSelectScissors}>
          scissors
        </button>
        <button disabled={!selectHandAble} onClick={handleSelectRock}>
          rock
        </button>
        <button disabled={!selectHandAble} onClick={handleSelectPaper}>
          paper
        </button>
      </div>
      <div className="item">
        <button disabled={!selectTpAble} onClick={handleSelectFirst}>
          first
        </button>
        <button disabled={!selectTpAble} onClick={handleSelectSecond}>
          second
        </button>
      </div>
    </div>
  );
}

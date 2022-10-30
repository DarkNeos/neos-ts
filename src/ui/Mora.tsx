/*
 * 猜拳页面
 *
 * */

import React from "react";
import { sendHandResult } from "../api/ocgcore/ocgHelper";
import "../css/Mora.css";
import { useAppSelector } from "../hook";
import { selectMoraSelectAble } from "../reducers/moraSlice";

// TODO: 应该展示对手卡组信息和聊天信息
export default function Mora() {
  const selectAble = useAppSelector(selectMoraSelectAble);

  const handleSelectScissors = () => {
    sendHandResult("scissors");
  };
  const handleSelectRock = () => {
    sendHandResult("rock");
  };
  const handleSelectPaper = () => {
    sendHandResult("paper");
  };

  return (
    <div className="container">
      <div className="item">
        <button disabled={!selectAble} onClick={handleSelectScissors}>
          scissors
        </button>
      </div>
      <div className="item">
        <button disabled={!selectAble} onClick={handleSelectRock}>
          rock
        </button>
      </div>
      <div className="item">
        <button disabled={!selectAble} onClick={handleSelectPaper}>
          paper
        </button>
      </div>
    </div>
  );
}

/*
 * 猜拳页面
 *
 * */

import React from "react";
import "../css/Mora.css";
import { useAppSelector } from "../hook";
import { selectMoraSelectAble } from "../reducers/moraSlice";

export default function Mora() {
  const selectAble = useAppSelector(selectMoraSelectAble);
  return (
    <div className="container">
      <div className="item">
        <button disabled={!selectAble}>rock</button>
      </div>
      <div className="item">
        <button disabled={!selectAble}>scissors</button>
      </div>
      <div className="item">
        <button disabled={!selectAble}>paper</button>
      </div>
    </div>
  );
}

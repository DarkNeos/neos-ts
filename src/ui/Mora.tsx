/*
 * 猜拳页面
 *
 * */

import React from "react";
import "../css/Mora.css";

export default function Mora() {
  return (
    <div className="container">
      <div className="item">
        <button>rock</button>
      </div>
      <div className="item">
        <button>scissors</button>
      </div>
      <div className="item">
        <button>paper</button>
      </div>
    </div>
  );
}

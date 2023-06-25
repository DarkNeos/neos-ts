import "./index.scss";

import React from "react";
import { useSnapshot } from "valtio";

import { matStore, playerStore } from "@/stores";

export const LifeBar: React.FC = () => {
  const snap = useSnapshot(matStore.initInfo);
  const snapPlayer = useSnapshot(playerStore);

  return (
    <div id="life-bar-container">
      <div className="life-bar">
        <div className="name">{snapPlayer.getMePlayer().name}</div>
        <div className="life">{snap.me.life}</div>
      </div>
      <div className="life-bar">
        <div className="name">{snapPlayer.getOpPlayer().name}</div>
        <div className="life">{snap.op.life}</div>
      </div>
    </div>
  );
};

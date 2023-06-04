import "./index.scss";

import React from "react";
import { useSnapshot } from "valtio";

import { matStore, playerStore } from "@/stores";

export const LifeBar: React.FC = () => {
  const snap = useSnapshot(matStore.initInfo);
  const snapPlayer = useSnapshot(playerStore);

  return (
    <div id="life-bar-container">
      <div id="life-bar">{`${snapPlayer.getMePlayer().name}: ${
        snap.me.life
      }`}</div>
      <div id="life-bar">{`${snapPlayer.getOpPlayer().name}: ${
        snap.op.life
      }`}</div>
    </div>
  );
};

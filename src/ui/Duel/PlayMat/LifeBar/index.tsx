import "./index.scss";

import React from "react";
import { useSnapshot } from "valtio";

import { matStore } from "@/stores";

export const LifeBar: React.FC = () => {
  const snap = useSnapshot(matStore.initInfo);
  const snapPlayer = useSnapshot(matStore.player);

  return (
    <div id="life-bar-container">
      <div id="life-bar">{`${snapPlayer.me().name}: ${snap.me.life}`}</div>
      <div id="life-bar">{`${snapPlayer.op().name}: ${snap.op.life}`}</div>
    </div>
  );
};

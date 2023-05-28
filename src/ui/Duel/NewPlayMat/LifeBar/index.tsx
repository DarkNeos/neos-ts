import "./index.scss";

import React from "react";
import { useSnapshot } from "valtio";

import { matStore } from "@/stores";

export const LifeBar: React.FC = () => {
  const snap = useSnapshot(matStore.initInfo);

  return (
    <div id="life-bar-container">
      <div id="life-bar">{`${snap.me.name}: ${snap.me.life}`}</div>
      <div id="life-bar">{`${snap.op.name}: ${snap.op.life}`}</div>
    </div>
  );
};

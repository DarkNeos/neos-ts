import "./index.scss";

import React from "react";
import { useSnapshot } from "valtio";

import { matStore, playerStore } from "@/stores";
import classNames from "classnames";

export const LifeBar: React.FC = () => {
  const snap = useSnapshot(matStore.initInfo);
  const snapPlayer = useSnapshot(playerStore);
  const { currentPlayer } = useSnapshot(matStore);

  return (
    <div id="life-bar-container">
      <div
        className={classNames("life-bar", {
          "life-bar-activated": matStore.isMe(currentPlayer),
        })}
      >
        <div className="name">{snapPlayer.getOpPlayer().name}</div>
        <div className="life">{snap.op.life}</div>
      </div>
      <div
        className={classNames("life-bar", {
          "life-bar-activated": matStore.isMe(currentPlayer),
        })}
      >
        <div className="name">{snapPlayer.getMePlayer().name}</div>
        <div className="life">{snap.me.life}</div>
      </div>
    </div>
  );
};

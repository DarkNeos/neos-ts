import "./index.scss";

import React, { useEffect } from "react";
import { useSnapshot } from "valtio";

import { matStore, playerStore } from "@/stores";
import classNames from "classnames";

import AnimatedNumbers from "react-animated-numbers";

// 三个候选方案
// https://snack.expo.dev/?platform=web
// https://github.com/heyman333/react-animated-numbers
// https://www.npmjs.com/package/react-countup?activeTab=dependents

export const LifeBar: React.FC = () => {
  const snap = useSnapshot(matStore.initInfo);
  const snapPlayer = useSnapshot(playerStore);
  const { currentPlayer } = useSnapshot(matStore);

  const [meLife, setMeLife] = React.useState(0);
  const [opLife, setOpLife] = React.useState(0);

  useEffect(() => {
    setMeLife(snap.me.life);
  }, [snap.me.life]);

  useEffect(() => {
    setOpLife(snap.op.life);
  }, [snap.op.life]);

  return (
    <div id="life-bar-container">
      <div
        className={classNames("life-bar", {
          "life-bar-activated": matStore.isMe(currentPlayer),
        })}
      >
        <div className="name">{snapPlayer.getOpPlayer().name}</div>
        <div className="life">
          {<AnimatedNumbers animateToNumber={opLife} />}
        </div>
      </div>
      <div
        className={classNames("life-bar", {
          "life-bar-activated": matStore.isMe(currentPlayer),
        })}
      >
        <div className="name">{snapPlayer.getMePlayer().name}</div>
        <div className="life">
          <AnimatedNumbers animateToNumber={meLife} />
        </div>
      </div>
    </div>
  );
};

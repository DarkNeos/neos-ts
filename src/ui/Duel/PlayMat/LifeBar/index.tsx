import styles from "./index.module.scss";

import { Progress } from "antd";
import classNames from "classnames";
import React, { useEffect, useState } from "react";
import AnimatedNumbers from "react-animated-numbers";
import { useSnapshot } from "valtio";

import { useEnv } from "@/hook";
import { matStore, playerStore } from "@/stores";
// 三个候选方案
// https://snack.expo.dev/?platform=web
// https://github.com/heyman333/react-animated-numbers
// https://www.npmjs.com/package/react-countup?activeTab=dependents

export const LifeBar: React.FC = () => {
  const snapInitInfo = useSnapshot(matStore.initInfo);
  const snapPlayer = useSnapshot(playerStore);
  const { currentPlayer } = useSnapshot(matStore);

  const [meLife, setMeLife] = React.useState(0);
  const [opLife, setOpLife] = React.useState(0);

  useEffect(() => {
    setMeLife(snapInitInfo.me.life);
  }, [snapInitInfo.me.life]);

  useEffect(() => {
    setOpLife(snapInitInfo.op.life);
  }, [snapInitInfo.op.life]);

  const snapTimeLimit = useSnapshot(matStore.timeLimits);
  const [myTimeLimit, setMyTimeLimit] = useState(snapTimeLimit.me);
  const [opTimeLimit, setOpTimeLimit] = useState(snapTimeLimit.op);
  useEffect(() => {
    setMyTimeLimit(snapTimeLimit.me);
  }, [snapTimeLimit.me]);
  useEffect(() => {
    setOpTimeLimit(snapTimeLimit.op);
  }, [snapTimeLimit.op]);

  useEffect(() => {
    setInterval(() => {
      setMyTimeLimit((time) => time - 1);
      setOpTimeLimit((time) => time - 1);
    }, 1000);
  }, []);

  useEffect(() => {
    if (useEnv().VITE_IS_AI_MODE) {
      // 如果是AI模式
      // FIXME: 探索一个优雅的、判断当前是不是AI模式的方法，用户手动输入AI也是AI模式
      setMyTimeLimit(240);
      setOpTimeLimit(240);
    }
  }, [currentPlayer]);

  return (
    <div className={styles.container}>
      <LifeBarItem
        active={!matStore.isMe(currentPlayer)}
        name={snapPlayer.getOpPlayer().name ?? "?"}
        life={opLife}
        timeLimit={opTimeLimit}
        isMe={false}
      />
      <LifeBarItem
        active={matStore.isMe(currentPlayer)}
        name={snapPlayer.getMePlayer().name ?? "?"}
        life={meLife}
        timeLimit={myTimeLimit}
        isMe={true}
      />
    </div>
  );
};

const LifeBarItem: React.FC<{
  active: boolean;
  name: string;
  life: number;
  timeLimit: number;
  isMe: boolean;
}> = ({ active, name, life, timeLimit, isMe }) => {
  const mm = Math.floor(timeLimit / 60);
  const ss = timeLimit % 60;
  const timeText =
    timeLimit < 0
      ? "00:00"
      : `${mm < 10 ? "0" + mm : mm}:${ss < 10 ? "0" + ss : ss}`;
  return (
    <div
      style={{
        flexDirection: isMe ? "column-reverse" : "column",
        overflow: "hidden",
        display: "flex",
        gap: "0.5rem",
        position: "relative",
      }}
    >
      <div
        className={classNames(styles["life-bar"], {
          "life-bar-activated": active,
        })}
      >
        <div className={styles.name}>{name}</div>
        <div className={styles.life}>
          {<AnimatedNumbers animateToNumber={life} />}
        </div>
      </div>
      {active && (
        <div className={styles["timer-container"]}>
          <Progress
            type="circle"
            percent={Math.floor((timeLimit / 240) * 100)}
            strokeWidth={20}
            size={14}
          />
          <div className={styles["timer-text"]}>{timeText}</div>
        </div>
      )}
    </div>
  );
};

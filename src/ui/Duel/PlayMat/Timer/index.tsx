import "./index.scss";

import React, { useEffect, useState } from "react";
import AnimatedNumbers from "react-animated-numbers";
import { useSnapshot } from "valtio";

import { matStore } from "@/stores";

export const Timer: React.FC = () => {
  const [time, setTime] = useState(0);
  const snap = useSnapshot(matStore);

  useEffect(() => {
    const interval = setInterval(() => {
      if (time > 0) {
        setTime((time) => time - 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setTime(snap.timeLimits.me);
  }, [snap.timeLimits.me]);

  useEffect(() => {
    setTime(snap.timeLimits.op);
  }, [snap.timeLimits.op]);

  return <div>{<AnimatedNumbers animateToNumber={time} />}</div>;
};

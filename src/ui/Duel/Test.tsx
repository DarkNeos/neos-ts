import { cardStore } from "@/stores";
import { useSnapshot } from "valtio";
import { subscribeKey, watch } from "valtio/utils";
import { FC, memo, useEffect, useState } from "react";
import { ygopro } from "@/api";
import {
  useSpring,
  SpringValue,
  animated,
  useSpringRef,
} from "@react-spring/web";

export const Test = () => {
  const snap = useSnapshot(cardStore.inner);
  return (
    <div
      style={{
        background: "white",
        position: "fixed",
        left: 0,
        top: 0,
        color: "black",
        zIndex: 9999,
        fontSize: 12,
      }}
    >
      {snap.map((cardState, i) => (
        <Card
          idx={i}
          key={i}
          show={[
            ygopro.CardZone.HAND,
            ygopro.CardZone.MZONE,
            ygopro.CardZone.SZONE,
            ygopro.CardZone.GRAVE,
          ].includes(cardState.zone)}
        />
      ))}
    </div>
  );
};

export const Card: FC<{ idx: number; show: boolean }> = memo(
  ({ idx, show }) => {
    const snap = useSnapshot(cardStore.inner[idx]);
    const api = useSpringRef();
    const props = useSpring({
      ref: api,
      from: { x: 0 },
    });
    // subscribeKey(cardStore.inner[idx], "zone", (value) => {
    //   api.start({
    //     to: {
    //       x: value * 100,
    //     },
    //   });
    // });
    watch((get) => {
      get(cardStore.inner[idx]);
      const zone = get(cardStore.inner[idx]).zone;
      api.start({
        to: {
          x: zone * 100,
        },
      });
    });
    return show ? (
      <animated.div
        style={{
          transform: props.x.to((value) => `translateX(${value}px)`),
          background: "white",
        }}
      >
        <div>code: {snap.code}</div>
        <div>{(Math.random() * 100).toFixed(0)}</div>
      </animated.div>
    ) : (
      <></>
    );
  },
  (prev, next) => prev.show === next.show // 只有 show 变化时才会重新渲染
);

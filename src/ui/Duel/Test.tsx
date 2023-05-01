import { cardStore } from "@/stores";
import { useSnapshot } from "valtio";
import { FC, memo, useEffect, useState } from "react";
import { ygopro } from "@/api";
import {
  useSpring,
  SpringValue,
  animated,
  useSpringRef,
} from "@react-spring/web";

export const Test = () => {
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
      {cardStore.inner.map((cardState, i) => (
        <Card idx={i} key={cardState.uuid} />
      ))}
    </div>
  );
};

export const Card: FC<{ idx: number }> = memo(({ idx }) => {
  const snap = useSnapshot(cardStore.inner[idx]);
  const [show, setShow] = useState(false);
  const api = useSpringRef();
  const props = useSpring({
    ref: api,
    from: { x: 0 },
  });
  useEffect(() => {
    setShow(
      [
        ygopro.CardZone.HAND,
        ygopro.CardZone.MZONE,
        ygopro.CardZone.SZONE,
      ].includes(snap.zone)
    );
    api.start({
      to: {
        x: props.x.get() === 100 ? 0 : 100,
      },
    });
  }, [snap.zone]); // 添加 show 到依赖项中
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
});

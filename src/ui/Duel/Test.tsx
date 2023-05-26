import { cardStore } from "@/stores";
import { useSnapshot } from "valtio";
import { FC } from "react";
import { ygopro } from "@/api";

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
      {cardStore.inner.map((cardState) => (
        <Card state={cardState} key={cardState.uuid} />
      ))}
    </div>
  );
};

export const Card: FC<{ state: (typeof cardStore.inner)[number] }> = ({
  state,
}) => {
  const snap = useSnapshot(state);
  const show = ![ygopro.CardZone.DECK].includes(snap.zone);
  return show ? (
    <div>
      <div>code: {snap.code}</div>
      {/* <div>zone: {ygopro.CardZone[snap.zone]}</div> */}
      <div>{(Math.random() * 100).toFixed(0)}</div>
    </div>
  ) : (
    <></>
  );
};

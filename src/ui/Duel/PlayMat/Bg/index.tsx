import "./index.scss";

import classnames from "classnames";
import { type CSSProperties, type FC } from "react";
import { type INTERNAL_Snapshot as Snapshot, useSnapshot } from "valtio";

import { sendSelectPlaceResponse, ygopro } from "@/api";
import {
  BlockState,
  cardStore,
  type PlaceInteractivity,
  placeStore,
} from "@/stores";

// Block被禁用的样式
const BgDisabledStyle = {
  background: `linear-gradient(
      to top right,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0) calc(50% - 1.5px),
      red 50%,
      rgba(0, 0, 0, 0) calc(50% + 1.5px),
      rgba(0, 0, 0, 0) 100%
    ), linear-gradient(
      to bottom right,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0) calc(50% - 1.5px),
      red 50%,
      rgba(0, 0, 0, 0) calc(50% + 1.5px),
      rgba(0, 0, 0, 0) 100%
    )`,
};

const BgExtraRow: FC<{
  meSnap: Snapshot<BlockState[]>;
  opSnap: Snapshot<BlockState[]>;
}> = ({ meSnap, opSnap }) => {
  return (
    <div className={classnames("bg-row")}>
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className={classnames("block", "extra", {
            highlight: !!meSnap[i].interactivity || !!opSnap[i].interactivity,
          })}
          style={
            meSnap[i].disabled || opSnap[i].disabled
              ? (BgDisabledStyle as CSSProperties)
              : {}
          }
          onClick={() => {
            onBlockClick(meSnap[i].interactivity);
            onBlockClick(opSnap[i].interactivity);
          }}
        ></div>
      ))}
    </div>
  );
};

const BgRow: FC<{
  isSzone?: boolean;
  opponent?: boolean;
  snap: Snapshot<BlockState[]>;
}> = ({ isSzone = false, opponent = false, snap }) => (
  <div className={classnames("bg-row", { opponent })}>
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className={classnames("block", {
          szone: isSzone,
          highlight: !!snap[i].interactivity,
        })}
        style={snap[i].disabled ? (BgDisabledStyle as CSSProperties) : {}}
        onClick={() => onBlockClick(snap[i].interactivity)}
      ></div>
    ))}
  </div>
);

export const Bg: FC = () => {
  const snap = useSnapshot(placeStore.inner);
  return (
    <div className="mat-bg">
      <BgRow snap={snap[ygopro.CardZone.SZONE].op} isSzone opponent />
      <BgRow snap={snap[ygopro.CardZone.MZONE].op} opponent />
      <BgExtraRow
        meSnap={snap[ygopro.CardZone.MZONE].me.slice(5, 7)}
        opSnap={snap[ygopro.CardZone.MZONE].op.slice(5, 7)}
      />
      <BgRow snap={snap[ygopro.CardZone.MZONE].me} />
      <BgRow snap={snap[ygopro.CardZone.SZONE].me} isSzone />
    </div>
  );
};

const onBlockClick = (placeInteractivity: PlaceInteractivity) => {
  if (placeInteractivity) {
    sendSelectPlaceResponse(placeInteractivity.response);
    cardStore.inner.forEach((card) => (card.idleInteractivities = []));
    placeStore.clearAllInteractivity();
  }
};

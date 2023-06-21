import "./index.scss";

import classnames from "classnames";
import { type FC } from "react";
import { type INTERNAL_Snapshot as Snapshot, useSnapshot } from "valtio";

import { sendSelectPlaceResponse, ygopro } from "@/api";
import {
  BlockState,
  cardStore,
  type PlaceInteractivity,
  placeStore,
} from "@/stores";

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

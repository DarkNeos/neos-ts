import { type FC } from "react";
import classnames from "classnames";
import "./index.scss";
import {
  placeStore,
  type PlaceInteractivity,
  messageStore,
  CardType,
  cardStore,
} from "@/stores";
import { useSnapshot, type INTERNAL_Snapshot as Snapshot } from "valtio";
import { sendSelectPlaceResponse, ygopro } from "@/api";
import { interactTypeToString } from "../../utils";

const BgExtraRow: FC = () => {
  return (
    <div className={classnames("bg-row")}>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className={classnames("block", "extra")}></div>
      ))}
    </div>
  );
};

const BgRow: FC<{
  isSzone?: boolean;
  opponent?: boolean;
  snap: Snapshot<PlaceInteractivity[]>;
}> = ({ isSzone = false, opponent = false, snap }) => (
  <div className={classnames("bg-row", { opponent })}>
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className={classnames("block", {
          szone: isSzone,
          highlight: !!snap[i],
        })}
        onClick={() => onBlockClick(snap[i])}
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
      <BgExtraRow />
      <BgRow snap={snap[ygopro.CardZone.MZONE].me} />
      <BgRow snap={snap[ygopro.CardZone.SZONE].me} isSzone />
    </div>
  );
};

const onBlockClick = (placeInteractivity: PlaceInteractivity) => {
  if (placeInteractivity) {
    sendSelectPlaceResponse(placeInteractivity.response);
    cardStore.inner.forEach((card) => (card.idleInteractivities = []));
    placeStore.clearAll();
  }
};

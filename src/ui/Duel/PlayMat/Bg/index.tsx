import "./index.scss";

import classnames from "classnames";
import { type INTERNAL_Snapshot as Snapshot, useSnapshot } from "valtio";

import { sendSelectPlaceResponse, ygopro } from "@/api";
import {
  type BlockState,
  cardStore,
  type PlaceInteractivity,
  placeStore,
} from "@/stores";

const BgBlock: React.FC<React.HTMLProps<HTMLDivElement>> = (props) => (
  <div {...props} className={classnames("block", props.className)}>
    {<DecoTriangles />}
    {<DisabledCross />}
  </div>
);

const BgExtraRow: React.FC<{
  meSnap: Snapshot<BlockState[]>;
  opSnap: Snapshot<BlockState[]>;
}> = ({ meSnap, opSnap }) => {
  return (
    <div className={classnames("bg-row")}>
      {Array.from({ length: 2 }).map((_, i) => (
        <BgBlock
          key={i}
          className={classnames("extra", {
            highlight: !!meSnap[i].interactivity || !!opSnap[i].interactivity,
            disabled: meSnap[i].disabled || opSnap[i].disabled,
          })}
          onClick={() => {
            onBlockClick(meSnap[i].interactivity);
            onBlockClick(opSnap[i].interactivity);
          }}
        />
      ))}
    </div>
  );
};

const BgRow: React.FC<{
  isSzone?: boolean;
  opponent?: boolean;
  snap: Snapshot<BlockState[]>;
}> = ({ isSzone = false, opponent = false, snap }) => (
  <div className={classnames("bg-row", { opponent })}>
    {Array.from({ length: 5 }).map((_, i) => (
      <BgBlock
        key={i}
        className={classnames({
          szone: isSzone,
          highlight: !!snap[i].interactivity,
          disabled: snap[i].disabled,
        })}
        onClick={() => onBlockClick(snap[i].interactivity)}
      />
    ))}
  </div>
);

const BgOtherBlocks: React.FC<{ className?: string }> = ({ className }) => (
  <div className={classnames("bg-other-blocks", className)}>
    <BgBlock className="banish" />
    <BgBlock className="graveyard" />
    <BgBlock className="field" />
  </div>
);

export const Bg: React.FC = () => {
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
      <BgOtherBlocks className="me" />
      <BgOtherBlocks className="op" />
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

const DecoTriangles: React.FC = () => (
  <>
    {Array.from({ length: 4 }).map((_, i) => (
      <div className="triangle" key={i} />
    ))}
  </>
);

const DisabledCross: React.FC = () => <div className="disabled-cross"></div>;

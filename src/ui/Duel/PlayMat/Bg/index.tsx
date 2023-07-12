import "./index.scss";

import classnames from "classnames";
import { type INTERNAL_Snapshot as Snapshot, useSnapshot } from "valtio";

import { sendSelectPlaceResponse, ygopro } from "@/api";
import {
  type BlockState,
  cardStore,
  type PlaceInteractivity,
  placeStore,
  isMe,
} from "@/stores";

const BgBlock: React.FC<
  React.HTMLProps<HTMLDivElement> & {
    disabled?: boolean;
    highlight?: boolean;
    glowing?: boolean;
  }
> = ({
  disabled = false,
  highlight = false,
  glowing = false,
  className,
  ...rest
}) => (
  <div
    {...rest}
    className={classnames("block", className, {
      highlight,
      glowing,
    })}
  >
    {<DecoTriangles />}
    {<DisabledCross disabled={disabled} />}
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
          className="extra"
          onClick={() => {
            onBlockClick(meSnap[i].interactivity);
            onBlockClick(opSnap[i].interactivity);
          }}
          disabled={meSnap[i].disabled || opSnap[i].disabled}
          highlight={!!meSnap[i].interactivity || !!opSnap[i].interactivity}
        />
      ))}
    </div>
  );
};

const BgRow: React.FC<{
  szone?: boolean;
  opponent?: boolean;
  snap: Snapshot<BlockState[]>;
}> = ({ szone = false, opponent = false, snap }) => (
  <div className={classnames("bg-row", { opponent })}>
    {Array.from({ length: 5 }).map((_, i) => (
      <BgBlock
        key={i}
        className={classnames({ szone })}
        onClick={() => onBlockClick(snap[i].interactivity)}
        disabled={snap[i].disabled}
        highlight={!!snap[i].interactivity}
      />
    ))}
  </div>
);

const BgOtherBlocks: React.FC<{ me?: boolean }> = ({ me }) => {
  const snapCards = useSnapshot(cardStore);
  const meController = isMe(0) ? 0 : 1;
  const judgeGlowing = (zone: ygopro.CardZone) =>
    !!snapCards
      .at(zone, meController)
      .reduce((sum, c) => (sum += c.idleInteractivities.length), 0);
  const glowingExtra = judgeGlowing(ygopro.CardZone.EXTRA);
  const glowingGraveyard = judgeGlowing(ygopro.CardZone.GRAVE);
  const glowingBanish = judgeGlowing(ygopro.CardZone.REMOVED);
  return (
    <div className={classnames("bg-other-blocks", { me, op: !me })}>
      <BgBlock className="banish" glowing={me && glowingBanish} />
      <BgBlock className="graveyard" glowing={me && glowingGraveyard} />
      <BgBlock className="field" />
      <BgBlock className="deck" />
      <BgBlock className="deck extra-deck" glowing={me && glowingExtra} />
    </div>
  );
};

export const Bg: React.FC = () => {
  const snap = useSnapshot(placeStore.inner);
  return (
    <div className="mat-bg">
      <BgRow snap={snap[ygopro.CardZone.SZONE].op} szone opponent />
      <BgRow snap={snap[ygopro.CardZone.MZONE].op} opponent />
      <BgExtraRow
        meSnap={snap[ygopro.CardZone.MZONE].me.slice(5, 7)}
        opSnap={snap[ygopro.CardZone.MZONE].op.slice(5, 7)}
      />
      <BgRow snap={snap[ygopro.CardZone.MZONE].me} />
      <BgRow snap={snap[ygopro.CardZone.SZONE].me} szone />
      <BgOtherBlocks me />
      <BgOtherBlocks />
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

const DisabledCross: React.FC<{ disabled: boolean }> = ({ disabled }) => (
  <div className={classnames("disabled-cross", { show: disabled })}></div>
);

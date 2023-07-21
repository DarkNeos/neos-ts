import classnames from "classnames";
import { type INTERNAL_Snapshot as Snapshot, useSnapshot } from "valtio";

import { sendSelectPlaceResponse, ygopro } from "@/api";
import {
  type BlockState,
  cardStore,
  isMe,
  type PlaceInteractivity,
  placeStore,
} from "@/stores";

import styles from "./index.module.scss";

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
    className={classnames(styles.block, className, {
      [styles.highlight]: highlight,
      [styles.glowing]: glowing,
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
    <div className={classnames(styles.row)}>
      {Array.from({ length: 2 }).map((_, i) => (
        <BgBlock
          key={i}
          className={styles.extra}
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
  <div className={classnames(styles.row, { [styles.opponent]: opponent })}>
    {Array.from({ length: 5 }).map((_, i) => (
      <BgBlock
        key={i}
        className={classnames({ [styles.szone]: szone })}
        onClick={() => onBlockClick(snap[i].interactivity)}
        disabled={snap[i].disabled}
        highlight={!!snap[i].interactivity}
      />
    ))}
  </div>
);

const BgOtherBlocks: React.FC<{ op?: boolean }> = ({ op }) => {
  useSnapshot(cardStore);
  const meController = isMe(0) ? 0 : 1;
  const judgeGlowing = (zone: ygopro.CardZone) =>
    !!cardStore
      .at(zone, meController)
      .reduce((sum, c) => (sum += c.idleInteractivities.length), 0);
  const glowingExtra = judgeGlowing(ygopro.CardZone.EXTRA);
  const glowingGraveyard = judgeGlowing(ygopro.CardZone.GRAVE);
  const glowingBanish = judgeGlowing(ygopro.CardZone.REMOVED);
  return (
    <div className={classnames(styles["other-blocks"], { [styles.op]: op })}>
      <BgBlock className={styles.banish} glowing={!op && glowingBanish} />
      <BgBlock className={styles.graveyard} glowing={!op && glowingGraveyard} />
      <BgBlock className={styles.field} />
      <BgBlock className={styles.deck} />
      <BgBlock
        className={classnames(styles.deck, styles["extra-deck"])}
        glowing={!op && glowingExtra}
      />
    </div>
  );
};

export const Bg: React.FC = () => {
  const snap = useSnapshot(placeStore.inner);
  return (
    <div className={styles["mat-bg"]}>
      <BgRow snap={snap[ygopro.CardZone.SZONE].op} szone opponent />
      <BgRow snap={snap[ygopro.CardZone.MZONE].op} opponent />
      <BgExtraRow
        meSnap={snap[ygopro.CardZone.MZONE].me.slice(5, 7)}
        opSnap={snap[ygopro.CardZone.MZONE].op.slice(5, 7)}
      />
      <BgRow snap={snap[ygopro.CardZone.MZONE].me} />
      <BgRow snap={snap[ygopro.CardZone.SZONE].me} szone />
      <BgOtherBlocks />
      <BgOtherBlocks op />
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
      <div className={styles.triangle} key={i} />
    ))}
  </>
);

const DisabledCross: React.FC<{ disabled: boolean }> = ({ disabled }) => (
  <div
    className={classnames(styles["disabled-cross"], {
      [styles.show]: disabled,
    })}
  ></div>
);

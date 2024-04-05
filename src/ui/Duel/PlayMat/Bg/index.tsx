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
import { BgChain, ChainProps } from "@/ui/Shared";

import styles from "./index.module.scss";

const { MZONE, SZONE, EXTRA, GRAVE, REMOVED } = ygopro.CardZone;

const BgBlock: React.FC<
  React.HTMLProps<HTMLDivElement> & {
    disabled?: boolean;
    highlight?: boolean;
    glowing?: boolean;
    chains: ChainProps;
  }
> = ({
  disabled = false,
  highlight = false,
  glowing = false,
  className,
  chains,
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
    {<BgChain {...chains} />}
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
            onBlockClick(opSnap[1 - i].interactivity);
          }}
          disabled={meSnap[i].disabled || opSnap[1 - i].disabled}
          highlight={!!meSnap[i].interactivity || !!opSnap[1 - i].interactivity}
          chains={{
            chains: meSnap[i].chainIndex.concat(opSnap[1 - i].chainIndex),
          }}
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
        chains={{ chains: snap[i].chainIndex }}
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
  const glowingExtra = judgeGlowing(EXTRA);
  const glowingGraveyard = judgeGlowing(GRAVE);
  const glowingBanish = judgeGlowing(REMOVED);
  const snap = useSnapshot(placeStore.inner);
  const field = op ? snap[SZONE].op[5] : snap[SZONE].me[5];
  const grave = op ? snap[GRAVE].op : snap[GRAVE].me;
  const removed = op ? snap[REMOVED].op : snap[REMOVED].me;
  const extra = op ? snap[EXTRA].op : snap[EXTRA].me;

  const genChains = (states: Snapshot<BlockState[]>) => {
    const chains: number[] = states.flatMap((state) => state.chainIndex);
    chains.sort();

    return chains;
  };

  return (
    <div className={classnames(styles["other-blocks"], { [styles.op]: op })}>
      <BgBlock
        className={styles.banish}
        glowing={!op && glowingBanish}
        chains={{ chains: genChains(removed), banish: true, op }}
      />
      <BgBlock
        className={styles.graveyard}
        glowing={!op && glowingGraveyard}
        chains={{ chains: genChains(grave), graveyard: true, op }}
      />
      <BgBlock
        className={styles.field}
        onClick={() => onBlockClick(field.interactivity)}
        disabled={field.disabled}
        highlight={!!field.interactivity}
        chains={{ chains: field.chainIndex, field: true, op }}
      />
      <BgBlock className={styles.deck} chains={{ chains: [] }} />
      <BgBlock
        className={classnames(styles.deck, styles["extra-deck"])}
        glowing={!op && glowingExtra}
        chains={{ chains: genChains(extra), extra: true, op }}
      />
    </div>
  );
};

export const Bg: React.FC = () => {
  const snap = useSnapshot(placeStore.inner);
  return (
    <div className={styles["mat-bg"]}>
      <BgRow snap={snap[SZONE].op} szone opponent />
      <BgRow snap={snap[MZONE].op} opponent />
      <BgExtraRow
        meSnap={snap[MZONE].me.slice(5, 7)}
        opSnap={snap[MZONE].op.slice(5, 7)}
      />
      <BgRow snap={snap[MZONE].me} />
      <BgRow snap={snap[SZONE].me} szone />
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
    {Array.from({ length: 2 }).map((_, i) => (
      <div className={styles.triangle} key={i}>
        <div className={styles["triangle-atom"]} />
        <div className={styles["triangle-atom"]} />
      </div>
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

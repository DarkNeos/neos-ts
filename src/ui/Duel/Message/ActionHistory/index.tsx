import { RightOutlined } from "@ant-design/icons";
import { Drawer } from "antd";
import React from "react";
import { proxy, useSnapshot } from "valtio";

import { fetchStrings, Region, ygopro } from "@/api";
import { useConfig } from "@/config";
import { History, HistoryOp, historyStore } from "@/stores";
import { ScrollableArea, YgoCard } from "@/ui/Shared";

import styles from "./index.module.scss";

const { assetsPath } = useConfig();

const defaultStore = {
  isOpen: false,
};

const store = proxy(defaultStore);

export const ActionHistory: React.FC = () => {
  const { isOpen } = useSnapshot(store);
  const { historys } = useSnapshot(historyStore);
  return (
    <Drawer
      open={isOpen}
      placement="right"
      rootClassName={styles.root}
      className={styles.drawer}
      mask={false}
      closeIcon={<RightOutlined />}
      onClose={() => (store.isOpen = false)}
      title="操作历史" // TODO: I18N
    >
      <ScrollableArea className={styles.container} maxHeight="var(--height)">
        <div className={styles.timeline}>
          {historys.map((history, idx) => (
            <HistoryItem key={idx} {...(history as History)} />
          ))}
        </div>
      </ScrollableArea>
    </Drawer>
  );
};

const HistoryItem: React.FC<History> = ({
  card,
  currentLocation,
  operation,
  target,
}) => (
  <div className={styles.history}>
    <div className={styles["card-container"]}>
      <YgoCard className={styles.card} code={card} />
      {currentLocation && (
        <div className={styles.location}>{`${zone2Text(
          currentLocation.zone,
        )}`}</div>
      )}
    </div>
    <div className={styles["op-container"]}>
      <div className={styles["op-text"]}>{Op2Text(operation)}</div>
      {operation === HistoryOp.MOVE ? (
        <img src={`${assetsPath}/arrow.svg`} className={styles["op-icon"]} />
      ) : operation === HistoryOp.EFFECT ? (
        <img src={`${assetsPath}/effect.png`} className={styles["op-icon"]} />
      ) : operation === HistoryOp.TARGETED ? (
        <img src={`${assetsPath}/targeted.png`} className={styles["op-icon"]} />
      ) : operation === HistoryOp.CONFIRMED ? (
        <img
          src={`${assetsPath}/confirmed.png`}
          className={styles["op-icon"]}
        />
      ) : operation === HistoryOp.ATTACK ? (
        <img src={`${assetsPath}/attack.png`} className={styles["op-icon"]} />
      ) : operation === HistoryOp.SET ? (
        <img src={`${assetsPath}/set.png`} className={styles["op-icon"]} />
      ) : (
        <img src={`${assetsPath}/summon.png`} className={styles["op-icon"]} />
      )}
    </div>
    {target && <div className={styles.target}>{`${zone2Text(target)}`}</div>}
  </div>
);

function zone2Text(zone: ygopro.CardZone): string {
  return fetchStrings(Region.System, zone + 1000);
}

// TODO: I18N
function Op2Text(op: HistoryOp): string {
  switch (op) {
    case HistoryOp.MOVE:
      return "移动";
    case HistoryOp.EFFECT:
      return fetchStrings(Region.System, 1150);
    case HistoryOp.TARGETED:
      return "被取对象";
    case HistoryOp.CONFIRMED:
      return "展示";
    case HistoryOp.ATTACK:
      return fetchStrings(Region.System, 1157);
    case HistoryOp.SUMMON:
      return fetchStrings(Region.System, 1151);
    case HistoryOp.SP_SUMMON:
      return fetchStrings(Region.System, 1152);
    case HistoryOp.FLIP_SUMMON:
      return fetchStrings(Region.System, 1154);
    case HistoryOp.SET:
      return fetchStrings(Region.System, 1153);
  }
}

export const displayActionHistory = () => (store.isOpen = true);

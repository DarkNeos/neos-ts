import { RightOutlined } from "@ant-design/icons";
import { Drawer } from "antd";
import type { OverlayScrollbarsComponentRef } from "overlayscrollbars-react";
import React, { useCallback, useEffect, useRef } from "react";
import { proxy, useSnapshot } from "valtio";

import { fetchStrings, Region, ygopro } from "@/api";
import { useConfig } from "@/config";
import { History, HistoryOp, historyStore, matStore } from "@/stores";
import { registerDuelDialogReset } from "@/stores/duelDialogs";
import { ScrollableArea, YgoCard } from "@/ui/Shared";

import { cancelOnRightClick } from "../../cancelOnRightClick";
import styles from "./index.module.scss";

const { assetsPath } = useConfig();

const defaultStore = {
  isOpen: false,
};

const store = proxy({ ...defaultStore });
registerDuelDialogReset(() => Object.assign(store, defaultStore));

export const ActionHistory: React.FC = () => {
  const { isOpen } = useSnapshot(store);
  const { historys } = useSnapshot(historyStore);
  const { selfType } = useSnapshot(matStore);
  const viewingPlayer =
    selfType === ygopro.StocTypeChange.SelfType.PLAYER2 ? 1 : 0;
  const scrollRef = useRef<OverlayScrollbarsComponentRef<"div">>(null);
  const scrollToBottom = useCallback(() => {
    const instance = scrollRef.current?.osInstance();
    if (instance) {
      // 先更新滚动容器尺寸，再操作其内部 viewport，确保新记录已经计入高度。
      instance.update();
      const viewport = instance.elements().viewport;
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, []);

  // 新记录追加和重新打开抽屉都滚到底部；首次打开还需等抽屉挂载完成。
  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen, historys.length, scrollToBottom]);

  return (
    <Drawer
      open={isOpen}
      placement="right"
      width="min(340px, calc(100vw - 24px))"
      rootClassName={`${styles.root} duel-side-drawer duel-translucent-drawer`}
      data-testid="duel-history-drawer"
      className={styles.drawer}
      mask={false}
      closeIcon={<RightOutlined />}
      onClose={() => (store.isOpen = false)}
      drawerRender={(node) => (
        <div
          style={{ display: "contents" }}
          onContextMenu={cancelOnRightClick(() => (store.isOpen = false))}
        >
          {node}
        </div>
      )}
      afterOpenChange={(open) => {
        if (open) scrollToBottom();
      }}
      title="操作历史" // TODO: I18N
    >
      <ScrollableArea
        ref={scrollRef}
        className={styles.container}
        scrollProps={{
          defer: false,
          options: {
            scrollbars: { autoHide: "never", theme: "os-theme-light" },
          },
        }}
      >
        <div className={styles.timeline}>
          {historys.map((history, idx) => (
            <HistoryItem
              key={idx}
              {...(history as History)}
              viewingPlayer={viewingPlayer}
            />
          ))}
        </div>
      </ScrollableArea>
    </Drawer>
  );
};

const HistoryItem: React.FC<History & { viewingPlayer: number }> = ({
  card,
  currentLocation,
  operation,
  target,
  viewingPlayer,
  text,
  player,
  chainIndex,
}) =>
  operation === HistoryOp.HINT ? (
    <div className={styles.note} data-testid="duel-history-hint">
      <small>{player === viewingPlayer ? "我方" : "对方"}</small>
      {card > 0 && <YgoCard width={30} code={card} />}
      <span>{text}</span>
    </div>
  ) : (
    <div className={styles.history} data-testid="duel-history-item">
      <div className={styles["card-container"]}>
        <YgoCard className={styles.card} code={card} />
        {currentLocation && (
          <HistoryLocation
            location={currentLocation}
            viewingPlayer={viewingPlayer}
          />
        )}
      </div>
      <div className={styles["op-container"]}>
        <div className={styles["op-text"]}>
          {operation === HistoryOp.TARGETED && chainIndex
            ? `连锁 ${chainIndex} 对象`
            : Op2Text(operation)}
        </div>
        {operation === HistoryOp.MOVE ? (
          <img src={`${assetsPath}/arrow.svg`} className={styles["op-icon"]} />
        ) : operation === HistoryOp.EFFECT ? (
          <img src={`${assetsPath}/effect.png`} className={styles["op-icon"]} />
        ) : operation === HistoryOp.TARGETED ? (
          <img
            src={`${assetsPath}/targeted.png`}
            className={styles["op-icon"]}
          />
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
      {target && (
        <div className={styles.target}>
          <HistoryLocation location={target} viewingPlayer={viewingPlayer} />
        </div>
      )}
    </div>
  );

const HistoryLocation: React.FC<{
  location: ygopro.CardLocation;
  viewingPlayer: number;
}> = ({ location, viewingPlayer }) => {
  const { zone, sequence, controller, is_overlay } = location;
  const { MZONE, SZONE } = ygopro.CardZone;
  const opponent = controller !== viewingPlayer;
  const side = opponent ? "对方" : "我方";
  const onField = !is_overlay && [MZONE, SZONE].includes(zone);
  const mainRow = onField && sequence < 5;
  const extraRow = onField && zone === MZONE && sequence >= 5 && sequence <= 6;
  const pendulumRow =
    onField && zone === SZONE && sequence >= 6 && sequence <= 7;
  const slots = mainRow ? 5 : extraRow || pendulumRow ? 2 : 0;
  const index = mainRow ? sequence : sequence - (extraRow ? 5 : 6);
  // 与当前场地视角一致：对方区域从右向左编号。
  const visualIndex = opponent ? slots - 1 - index : index;
  const name = is_overlay
    ? "超量素材"
    : zone === SZONE && sequence === 5
    ? "场地区"
    : extraRow
    ? "额外怪兽区"
    : pendulumRow
    ? "灵摆区"
    : zone2Text(zone);
  const label = `${side}${name}${
    slots ? `，从左第 ${visualIndex + 1} 格` : ""
  }`;

  return (
    <div
      className={styles.location}
      data-testid="duel-history-location"
      data-location-controller={controller}
      data-location-zone={ygopro.CardZone[zone]}
      data-location-sequence={sequence}
      aria-label={label}
      title={label}
    >
      <span className={styles.side}>{side}</span>
      <span>{name}</span>
      {slots > 0 && (
        <span className={styles["zone-map"]} aria-hidden="true">
          {Array.from({ length: slots }, (_, slot) => (
            <i key={slot} data-active={slot === visualIndex} />
          ))}
        </span>
      )}
    </div>
  );
};

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
    case HistoryOp.HINT:
      return "提示";
  }
}

export const displayActionHistory = () => (store.isOpen = true);

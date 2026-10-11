import { useEffect } from "react";
import { useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { cardStore, replayStore } from "@/stores";
import { fieldInspection } from "@/stores/fieldInspection";

import { Bg } from "../Bg";
import { Card } from "../Card";
import { getExtraDeckStackIndex } from "../Card/springs/moveToDeck";
import { FieldConnections } from "../FieldConnections";
import {
  FieldRelationsProvider,
  useFieldRelations,
} from "../FieldRelationsProvider";
import { FieldControls } from "../Menu";
import { ZoneCounts } from "../ZoneCounts";
import styles from "./index.module.scss";

// 后面再改名
export const Mat: React.FC = () => {
  return (
    <section
      className={`${styles.mat} duel-mat`}
      onClick={(event) => {
        if (!(event.target as Element).closest('[data-testid="duel-card"]'))
          fieldInspection.pinned = null;
      }}
    >
      <div className={`${styles.camera} duel-mat-camera`}>
        <div className={`${styles.plane} duel-mat-plane`}>
          <Bg />
          <FieldRelationsProvider>
            <div className={`${styles.container} duel-mat-card-container`}>
              <Cards />
            </div>
            <FieldConnections />
          </FieldRelationsProvider>
          <FieldControls />
          <ZoneCounts />
        </div>
      </div>
    </section>
  );
};

const Cards: React.FC = () => {
  const { inner } = useSnapshot(cardStore);
  const { activeCards } = useFieldRelations();
  const { rebuilding, renderPending, revision } = useSnapshot(replayStore);
  useEffect(() => {
    if (!renderPending) return;
    // 两次动画帧等待卡片挂载、初始定位和 spring 的 DOM 写入，随后才完成定位。
    // 传回本次 revision，已取消定位留下的回调不能确认新一轮渲染。
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => replayStore.finishRender(revision));
    });
    return () => cancelAnimationFrame(frame);
  }, [renderPending, revision]);
  if (rebuilding) return null;
  const stackSizes = new Map<string, number>();
  const { DECK, EXTRA, GRAVE, REMOVED, TZONE } = ygopro.CardZone;
  for (const { location } of inner) {
    if (location.is_overlay) continue;
    const key = `${location.controller}-${location.zone}`;
    stackSizes.set(key, (stackSizes.get(key) ?? 0) + 1);
  }
  const length = inner.length;
  return (
    <>
      {Array.from({ length }).map((_, i) => {
        const card = inner[i];
        const { zone, controller, sequence, is_overlay } = card.location;
        const extraStackIndex = getExtraDeckStackIndex(card, inner);
        // 顶部三张保留完整内容，下层用轻量表面绘制连续的牌堆边缘。
        const visible =
          !is_overlay &&
          zone !== TZONE &&
          (![DECK, EXTRA, GRAVE, REMOVED].includes(zone) ||
            (extraStackIndex ?? sequence) >=
              (stackSizes.get(`${controller}-${zone}`) ?? 0) - 3);
        return (
          <Card
            key={card.uuid}
            idx={i}
            relationActive={activeCards.has(card.uuid)}
            visible={visible}
            extraStackIndex={extraStackIndex}
          />
        );
      })}
    </>
  );
};

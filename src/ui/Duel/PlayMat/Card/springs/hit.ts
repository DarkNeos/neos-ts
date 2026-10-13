import { easings, type SpringRef } from "@react-spring/web";

import type { ygopro } from "@/api";
import { duelAnimation, duelDuration } from "@/infra/duelAnimation";
import { replayPresentation } from "@/infra/replayPresentation";
import type { CardType } from "@/stores";
import { settingStore } from "@/stores/settingStore";

import { fieldPoint } from "../../fieldGeometry";
import { asyncStart, setImmediate } from "./utils";

export interface HitOptions {
  origin: ygopro.CardLocation;
  signal?: AbortSignal;
}

/** 只改变局部偏移，卡片的场地位置和朝向继续由原动画管理。 */
export const hit = async ({
  card,
  api,
  options,
}: {
  card: CardType;
  api: SpringRef<{ x: number; y: number }>;
  options: HitOptions;
}) => {
  const { signal } = options;
  const skipped = () =>
    signal?.aborted ||
    document.hidden ||
    replayPresentation.seeking ||
    !settingStore.animation.enabled;
  if (skipped()) return;

  const origin = fieldPoint(options.origin);
  const target = fieldPoint(card.location);
  const dx = target.x - origin.x,
    dy = target.y - origin.y;
  const distance = Math.hypot(dx, dy);
  if (!distance) return;

  const reset = () => {
    api.stop();
    setImmediate(api, { x: 0, y: 0 });
  };
  signal?.addEventListener("abort", reset, { once: true });
  const offsets = [12, -8, 5, -3, 0];
  const start = asyncStart(api);
  try {
    for (const offset of offsets) {
      if (skipped()) break;
      await start({
        x: (dx / distance) * offset,
        y: (dy / distance) * offset,
        config: {
          duration: duelDuration(duelAnimation.attack.hit) / offsets.length,
          easing: easings.easeOutSine,
          clamp: true,
        },
      });
    }
  } finally {
    signal?.removeEventListener("abort", reset);
    reset();
  }
};

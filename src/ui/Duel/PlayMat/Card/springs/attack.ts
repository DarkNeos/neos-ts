import { easings } from "@react-spring/web";

import { duelAnimation, duelDuration } from "@/infra/duelAnimation";
import { presentationDelay } from "@/infra/presentationDelay";
import { replayPresentation } from "@/infra/replayPresentation";
import { settingStore } from "@/stores/settingStore";

import { directAttackPoint, fieldPoint } from "../../fieldGeometry";
import type { AttackFunc } from "./types";
import { asyncStart, setImmediate } from "./utils";

export const attack: AttackFunc = async ({ card, api, options }) => {
  if (!options || options.signal?.aborted) return;
  if (
    document.hidden ||
    replayPresentation.seeking ||
    !settingStore.animation.enabled
  ) {
    options.onImpact?.();
    return;
  }
  const current = { ...api.current[0].get() };
  const configs = Object.fromEntries(
    Object.entries(api.current[0].springs).map(([key, spring]) => [
      key,
      { ...spring.animation.config },
    ]),
  );
  const target = options.directAttack
    ? directAttackPoint(card.location.controller)
    : fieldPoint(options.target);
  const dx = target.x - current.x,
    dy = target.y - current.y;
  const distance = Math.hypot(dx, dy);
  const angle = distance ? (Math.atan2(dx, -dy) * 180) / Math.PI : current.rz;
  // 取离当前朝向最近的等价角度，避免跨过 ±180° 时转近一整圈。
  const rz = current.rz + ((((angle - current.rz) % 360) + 540) % 360) - 180;
  // 普通移卡速度仍可调；高攻击力保留稍长的蓄力与冲刺。
  const powerful = (options.attack ?? card.meta.data.atk ?? 0) >= 2000;
  const timing = duelAnimation.attack;
  const prepare = duelDuration(
    powerful ? timing.powerfulPrepare : timing.prepare,
  );
  const rush = duelDuration(powerful ? timing.powerfulRush : timing.rush);
  const signal = options.signal;
  const cancel = () => {
    api.stop();
    setImmediate(api, current);
  };
  signal?.addEventListener("abort", cancel, { once: true });
  const start = asyncStart(api);
  try {
    api.set({ zIndex: 100 });
    await start({
      z: 200,
      config: {
        duration: prepare / 2,
        easing: easings.easeOutQuad,
        clamp: true,
      },
    });
    if (signal?.aborted) return;
    await start({
      x: current.x - (distance ? dx / distance : 0) * 40,
      y: current.y - (distance ? dy / distance : 0) * 40,
      rz,
      config: {
        duration: prepare / 2,
        easing: easings.easeInOutSine,
        clamp: true,
      },
    });
    if (signal?.aborted) return;
    await start({
      ...target,
      config: { duration: rush, easing: easings.easeInCubic, clamp: true },
    });
    if (signal?.aborted) return;
    // 此刻释放战斗消息等待；真实 DAMAGE 可显示数字，卡片仍占用自己的动画队列。
    options.onImpact?.();
    await presentationDelay(timing.hold, signal);
    if (signal?.aborted) return;
    await start({
      ...current,
      zIndex: 100,
      config: {
        duration: duelDuration(timing.leave),
        easing: easings.easeOutCubic,
        clamp: true,
      },
    });
  } finally {
    signal?.removeEventListener("abort", cancel);
    setImmediate(api, current);
    await Promise.all(
      api.start({ ...current, immediate: true, config: (key) => configs[key] }),
    );
  }
};

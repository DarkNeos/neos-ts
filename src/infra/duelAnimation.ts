import { settingStore } from "@/stores/settingStore";

import { replayDuration } from "./replayPresentation";

// 默认速度 0.7、录像 1 倍时的毫秒数。持续提示不使用这组演出时长。
export const duelAnimation = {
  move: 200,
  land: 80,
  drawStagger: 60,
  reveal: { enter: 150, hold: 300, leave: 150, stagger: 80 },
  summon: { normal: 120, special: 220, typed: 320, token: 100 },
  overlay: { absorb: 290, fade: 60, stagger: 20 },
  shuffle: 140,
  tokenDisappear: 140,
  chain: { built: 140, solving: 220 },
  attack: {
    prepare: 250,
    powerfulPrepare: 400,
    rush: 100,
    powerfulRush: 150,
    hit: 180,
    hold: 200,
    leave: 250,
  },
  life: { roll: 400, change: 800, flash: 400 },
  phase: 500,
  toss: 650,
} as const;

/** spring 使用此值，再由 asyncStart 应用录像倍速，避免重复缩放。 */
export function duelDuration(duration: number) {
  const speed = Math.min(1, Math.max(0, settingStore.animation.speed));
  return duration * ((400 - speed * 300) / 190);
}

/** CSS、计时器和 RAF 使用完整的对局演出时长。 */
export const presentationDuration = (duration: number) =>
  replayDuration(duelDuration(duration));

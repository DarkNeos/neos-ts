import { easings } from "@react-spring/web";
import { subscribe } from "valtio";

import { ygopro } from "@/api";
import { replayDuration } from "@/infra/replayPresentation";
import { type CardType, matStore } from "@/stores";
import { settingStore } from "@/stores/settingStore";

import type { SpringApi } from "./types";
import { asyncStart } from "./utils";

export interface ConfirmOptions {
  signal?: AbortSignal;
}

// 公开卡片时保留阅读时间，独立于普通移卡速度。
const MOVE_DURATION = 180;
const HOLD_DURATION = 400;

const waitForReading = (signal?: AbortSignal) => {
  if (signal?.aborted || document.hidden || !settingStore.animation.enabled)
    return Promise.resolve();

  return new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      unsubscribe();
      signal?.removeEventListener("abort", finish);
      resolve();
    };
    const onVisibilityChange = () => {
      if (document.hidden) finish();
    };
    const onAnimationChange = () => {
      if (!settingStore.animation.enabled) finish();
    };
    const timer = setTimeout(finish, replayDuration(HOLD_DURATION));
    document.addEventListener("visibilitychange", onVisibilityChange);
    const unsubscribe = subscribe(
      settingStore.animation,
      onAnimationChange,
      true,
    );
    signal?.addEventListener("abort", finish, { once: true });
  });
};

export const confirm = async (props: {
  card: CardType;
  api: SpringApi;
  options?: ConfirmOptions;
}) => {
  const { card, api, options } = props;
  const signal = options?.signal;
  if (signal?.aborted || document.hidden || !settingStore.animation.enabled) {
    // 跳过演出仍需同步公开手牌的最终朝向。
    if (card.location.zone === ygopro.CardZone.HAND && card.code > 0)
      api.set({ ry: 0 });
    return;
  }

  const current = { ...api.current[0].get() };
  const resting = {
    ...current,
    ry:
      card.location.zone === ygopro.CardZone.HAND && card.code > 0
        ? 0
        : current.ry,
  };
  const configs = Object.fromEntries(
    Object.entries(api.current[0].springs).map(([key, spring]) => [
      key,
      { ...spring.animation.config },
    ]),
  );
  const cancel = () => {
    api.stop();
    api.set(resting);
  };
  signal?.addEventListener("abort", cancel, { once: true });
  const { HAND, DECK, EXTRA } = ygopro.CardZone;
  const distance = [HAND, DECK, EXTRA].includes(card.location.zone)
    ? current.height * 0.45
    : current.height * 0.12;
  const config = { duration: MOVE_DURATION, clamp: true };

  try {
    // 展示期间保持在其他卡片上方，收回完成后再恢复原来的层级。
    api.set({ zIndex: 100 });
    await asyncStart(api)({
      y:
        current.y +
        (matStore.isMe(card.location.controller) ? -1 : 1) * distance,
      z: current.z + 18,
      ry: 0,
      // 保留手卡排列的角度，只翻开卡面，避免同时绕两个轴旋转。
      config: { ...config, easing: easings.easeOutCubic },
    });
    if (signal?.aborted) return;
    await waitForReading(signal);
    if (signal?.aborted) return;
    await asyncStart(api)({
      ...resting,
      zIndex: 100,
      config: { ...config, easing: easings.easeInOutCubic },
    });
  } finally {
    signal?.removeEventListener("abort", cancel);
    api.set(resting);
    // react-spring 会保留配置，恢复展示前的配置以免影响后续发动动画。
    void api.start({ config: (key) => configs[key] });
  }
};

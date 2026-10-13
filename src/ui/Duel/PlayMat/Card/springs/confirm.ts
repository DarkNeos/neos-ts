import { easings } from "@react-spring/web";

import { ygopro } from "@/api";
import { duelAnimation, duelDuration } from "@/infra/duelAnimation";
import { presentationDelay } from "@/infra/presentationDelay";
import { replayPresentation } from "@/infra/replayPresentation";
import { type CardType, matStore } from "@/stores";
import { settingStore } from "@/stores/settingStore";

import type { SpringApi } from "./types";
import { asyncStart, setImmediate } from "./utils";

export interface ConfirmOptions {
  signal?: AbortSignal;
  onReturnStart?: () => void;
}

export const confirm = async (props: {
  card: CardType;
  api: SpringApi;
  options?: ConfirmOptions;
}) => {
  const { card, api, options } = props;
  const signal = options?.signal;
  if (
    signal?.aborted ||
    document.hidden ||
    replayPresentation.seeking ||
    !settingStore.animation.enabled
  ) {
    // 跳过演出仍需同步公开手牌的最终朝向。
    if (card.location.zone === ygopro.CardZone.HAND && card.code > 0)
      setImmediate(api, { ry: 0 });
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
    setImmediate(api, resting);
  };
  signal?.addEventListener("abort", cancel, { once: true });
  const { HAND, DECK, EXTRA } = ygopro.CardZone;
  const distance = [HAND, DECK, EXTRA].includes(card.location.zone)
    ? current.height * 0.45
    : current.height * 0.12;
  const timing = duelAnimation.reveal;

  try {
    // 展示期间保持置顶，保留手牌排列的角度，只翻开卡面。
    api.set({ zIndex: 100 });
    await asyncStart(api)({
      y:
        current.y +
        (matStore.isMe(card.location.controller) ? -1 : 1) * distance,
      z: current.z + 18,
      ry: 0,
      config: {
        duration: duelDuration(timing.enter),
        clamp: true,
        easing: easings.easeOutCubic,
      },
    });
    if (signal?.aborted) return;
    await presentationDelay(timing.hold, signal);
    if (signal?.aborted) return;
    options?.onReturnStart?.();
    await asyncStart(api)({
      ...resting,
      zIndex: 100,
      config: {
        duration: duelDuration(timing.leave),
        clamp: true,
        easing: easings.easeInOutCubic,
      },
    });
  } finally {
    signal?.removeEventListener("abort", cancel);
    // 同时恢复目标和配置，避免中断后只改配置又重新追向展示位置。
    setImmediate(api, resting);
    await Promise.all(
      api.start({ ...resting, immediate: true, config: (key) => configs[key] }),
    );
  }
};

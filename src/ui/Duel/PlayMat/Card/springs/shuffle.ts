import { easings } from "@react-spring/web";

import { duelAnimation, duelDuration } from "@/infra/duelAnimation";
import type { CardType } from "@/stores";
import { settingStore } from "@/stores/settingStore";

import type { SpringApi } from "./types";
import { asyncStart, setImmediate } from "./utils";

export interface ShuffleOptions {
  signal?: AbortSignal;
}

export const shuffle = async ({
  card,
  api,
  options,
}: {
  card: CardType;
  api: SpringApi;
  options?: ShuffleOptions;
}) => {
  const signal = options?.signal;
  if (signal?.aborted || document.hidden || !settingStore.animation.enabled)
    return;
  const current = { ...api.current[0].get() };
  const configs = Object.fromEntries(
    Object.entries(api.current[0].springs).map(([key, spring]) => [
      key,
      { ...spring.animation.config },
    ]),
  );
  const cancel = () => {
    api.stop();
    setImmediate(api, current);
  };
  signal?.addEventListener("abort", cancel, { once: true });
  const config = {
    duration: duelDuration(duelAnimation.shuffle) / 3,
    easing: easings.easeInOutCubic,
    clamp: true,
  };
  const distance = current.height * 0.3;
  const direction = card.location.sequence % 2 === 0 ? 1 : -1;
  try {
    await asyncStart(api)({
      x: current.x + distance * direction,
      rz: current.rz + 5 * direction,
      config,
    });
    if (signal?.aborted) return;
    await asyncStart(api)({
      x: current.x - distance * direction,
      rz: current.rz - 5 * direction,
      config,
    });
    if (signal?.aborted) return;
    await asyncStart(api)({ x: current.x, rz: current.rz, config });
  } finally {
    signal?.removeEventListener("abort", cancel);
    setImmediate(api, current);
    await Promise.all(
      api.start({ ...current, immediate: true, config: (key) => configs[key] }),
    );
  }
};

import { easings } from "@react-spring/web";

import type { CardType } from "@/stores";
import { settingStore } from "@/stores/settingStore";

import type { SpringApi } from "./types";
import { asyncStart, getDuration } from "./utils";

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
    api.set(current);
  };
  signal?.addEventListener("abort", cancel, { once: true });
  const config = {
    duration: getDuration() / 3,
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
    api.set({ x: current.x, rz: current.rz });
    void api.start({ config: (key) => configs[key] });
  }
};

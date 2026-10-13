import { easings } from "@react-spring/web";

import { ygopro } from "@/api";
import { duelAnimation, duelDuration } from "@/infra/duelAnimation";
import { presentationDelay } from "@/infra/presentationDelay";
import { replayPresentation } from "@/infra/replayPresentation";
import { type CardType, matStore } from "@/stores";
import { settingStore } from "@/stores/settingStore";

import { matConfig } from "../../css";
import { confirm, type ConfirmOptions } from "./confirm";
import type { SpringApi } from "./types";
import { asyncStart, setImmediate } from "./utils";

export type FocusOptions = ConfirmOptions;

/** 各区域使用相同的进入、阅读和收回时长，区域只决定动作形态。 */
export const focus = async ({
  card,
  api,
  options,
}: {
  card: CardType;
  api: SpringApi;
  options?: FocusOptions;
}) => {
  const signal = options?.signal;
  if (
    signal?.aborted ||
    document.hidden ||
    replayPresentation.seeking ||
    !settingStore.animation.enabled
  )
    return;
  const { HAND, DECK, EXTRA, GRAVE, REMOVED } = ygopro.CardZone;
  if ([HAND, DECK, EXTRA].includes(card.location.zone)) {
    await confirm({ card, api, options });
    return;
  }

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
  const outside = [GRAVE, REMOVED].includes(card.location.zone);
  const isGrave = card.location.zone === GRAVE;
  const extraHeight = isGrave ? 0 : current.height * 0.5;
  const direction = matStore.isMe(card.location.controller) ? -1 : 1;
  const raisedY =
    current.y - extraHeight / 2 + direction * current.height * 0.3;
  const timing = duelAnimation.reveal;
  const start = asyncStart(api);
  try {
    api.set(
      outside
        ? { zIndex: 1000 }
        : { focusDisplay: "block", focusScale: 1, focusOpacity: 1 },
    );
    await start({
      ...(outside
        ? {
            x: current.x - (extraHeight * matConfig.CARD_RATIO) / 2,
            y: raisedY,
            // 墓地在屏幕平面升起，避免透视造成额外放大。
            z: current.z + (isGrave ? 0 : 50),
            height: current.height + extraHeight,
            ry: 0,
          }
        : { focusScale: 1.15, focusOpacity: 0.7 }),
      config: {
        duration: duelDuration(timing.enter),
        clamp: true,
        easing: easings.easeOutCubic,
      },
    });
    if (signal?.aborted) return;
    if (outside) {
      await start({
        y: isGrave ? raisedY + direction * current.height * 0.03 : raisedY,
        z: current.z + (isGrave ? 0 : 55),
        config: {
          duration: duelDuration(timing.hold),
          clamp: true,
          easing: easings.linear,
        },
      });
    } else await presentationDelay(timing.hold, signal);
    if (signal?.aborted) return;
    // 连锁建立短闪与收回重叠，卡片队列仍等待整个动作完成。
    options?.onReturnStart?.();
    await start({
      ...(outside
        ? { ...current, zIndex: 1000 }
        : { focusScale: 1.5, focusOpacity: 0 }),
      config: {
        duration: duelDuration(timing.leave),
        clamp: true,
        easing: easings.easeInOutCubic,
      },
    });
  } finally {
    signal?.removeEventListener("abort", cancel);
    setImmediate(api, {
      ...current,
      ...(outside ? { zIndex: card.location.sequence } : {}),
    });
    await Promise.all(
      api.start({
        ...current,
        ...(outside ? { zIndex: card.location.sequence } : {}),
        immediate: true,
        config: (key) => configs[key],
      }),
    );
  }
};

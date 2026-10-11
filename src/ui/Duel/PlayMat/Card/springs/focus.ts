import { easings } from "@react-spring/web";

import { ygopro } from "@/api";
import { type CardType, matStore } from "@/stores";
import { settingStore } from "@/stores/settingStore";

import { matConfig } from "../../css";
import { confirm } from "./confirm";
import type { SpringApi } from "./types";
import { asyncStart } from "./utils";

/** 墓地和除外区的发动展示只临时抬起卡片，结束后恢复叠放位置及弹簧配置。 */
const focusOutside = async (card: CardType, api: SpringApi) => {
  if (document.hidden || !settingStore.animation.enabled) return;

  // 保存全部弹簧状态和配置，恢复后不会遗留展示动画的 duration 或 easing。
  const current = { ...api.current[0].get() };
  const configs = Object.fromEntries(
    Object.entries(api.current[0].springs).map(([key, spring]) => [
      key,
      { ...spring.animation.config },
    ]),
  );
  const isGrave = card.location.zone === ygopro.CardZone.GRAVE;
  const extraHeight = isGrave ? 0 : current.height * 0.5;
  const direction = matStore.isMe(card.location.controller) ? -1 : 1;
  const raisedY =
    current.y - extraHeight / 2 + direction * current.height * 0.3;
  const config = { duration: 100, clamp: true };

  try {
    // 发动展示临时置顶，不修改墓地或除外区的卡片序号。
    api.set({ zIndex: 1000 });
    await asyncStart(api)({
      x: current.x - (extraHeight * matConfig.CARD_RATIO) / 2,
      y: raisedY,
      // 墓地只在屏幕平面内升起，避免透视深度产生额外放大。
      z: current.z + (isGrave ? 0 : 50),
      height: current.height + extraHeight,
      ry: 0,
      config: { ...config, easing: easings.easeOutCubic },
    });
    // 与 MDPRO3 一样，展示期间缓慢上浮，保留独立的阅读时间。
    await asyncStart(api)({
      y: isGrave ? raisedY + direction * current.height * 0.03 : raisedY,
      z: current.z + (isGrave ? 0 : 55),
      config: { duration: 350, clamp: true, easing: easings.linear },
    });
    await asyncStart(api)({
      ...current,
      zIndex: 1000,
      config: { ...config, easing: easings.easeInOutCubic },
    });
  } finally {
    // 同时恢复位置、动画目标和配置，后台跳过时也不会重新升起。
    await Promise.all(
      api.start({
        ...current,
        zIndex: card.location.sequence,
        immediate: true,
        config: (key) => configs[key],
      }),
    );
  }
};

/** 发动效果的动画 */
export const focus = async (props: { card: CardType; api: SpringApi }) => {
  const { card, api } = props;
  if (
    [ygopro.CardZone.GRAVE, ygopro.CardZone.REMOVED].includes(
      card.location.zone,
    )
  ) {
    await focusOutside(card, api);
    return;
  }
  if (
    card.location.zone === ygopro.CardZone.HAND ||
    card.location.zone === ygopro.CardZone.DECK ||
    card.location.zone === ygopro.CardZone.EXTRA
  ) {
    // 发动和检索公开共用升起高度、阅读停留与落下时长。
    await confirm({ card, api });
  } else {
    await asyncStart(api)({
      focusScale: 1.5,
      focusDisplay: "block",
      focusOpacity: 0,
    });
    api.set({ focusScale: 1, focusOpacity: 1, focusDisplay: "none" });
  }
};

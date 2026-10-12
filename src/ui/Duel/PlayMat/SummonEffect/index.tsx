import { type CSSProperties, useEffect } from "react";
import { proxy, useSnapshot } from "valtio";

import { type ygopro } from "@/api";
import {
  TYPE_FUSION,
  TYPE_LINK,
  TYPE_PENDULUM,
  TYPE_RITUAL,
  TYPE_SYNCHRO,
  TYPE_TOKEN,
  TYPE_XYZ,
} from "@/common";
import { duelAnimation, presentationDuration } from "@/infra/duelAnimation";
import { presentationDelay } from "@/infra/presentationDelay";
import { replayPresentation } from "@/infra/replayPresentation";
import { createDuelDialog } from "@/stores/duelDialogs";
import { settingStore } from "@/stores/settingStore";

import { fieldPoint } from "../fieldGeometry";
import styles from "./index.module.scss";

type SummonKind = "normal" | "special" | "flip";
interface SummonInfo {
  id: number;
  kind: SummonKind;
  x: number;
  y: number;
  color: string;
  duration: number;
}
const state = proxy<{ effect: SummonInfo | null }>({ effect: null });
let sequence = 0;
let mounted = false;
const dialog = createDuelDialog(() => {
  state.effect = null;
}, undefined);

/** 颜色依据怪兽类型；不从卡片类型推断本次实际召唤方式。 */
export function displaySummonEffect(
  location: ygopro.CardLocation,
  type: number,
  kind: SummonKind,
) {
  dialog.finish();
  if (
    !mounted ||
    document.hidden ||
    replayPresentation.seeking ||
    !settingStore.animation.enabled
  )
    return Promise.resolve();
  const typed =
    type & (TYPE_FUSION | TYPE_SYNCHRO | TYPE_XYZ | TYPE_LINK | TYPE_RITUAL);
  const timing = duelAnimation.summon;
  const duration =
    kind !== "special"
      ? timing.normal
      : type & TYPE_TOKEN
      ? timing.token
      : typed
      ? timing.typed
      : timing.special;
  const color =
    kind !== "special"
      ? "#ffe4a3"
      : type & TYPE_FUSION
      ? "#d59dff"
      : type & TYPE_SYNCHRO
      ? "#e9faff"
      : type & TYPE_XYZ
      ? "#ffd274"
      : type & TYPE_LINK
      ? "#76b9ff"
      : type & TYPE_RITUAL
      ? "#a2aaff"
      : type & TYPE_PENDULUM
      ? "#83edb2"
      : "#7ce6e6";
  const id = ++sequence;
  state.effect = { id, kind, ...fieldPoint(location), color, duration };
  const finished = dialog.wait();
  void presentationDelay(duration).then(() => {
    if (state.effect?.id === id) dialog.finish();
  });
  return finished;
}

export const SummonEffect = () => {
  const { effect } = useSnapshot(state);
  useSnapshot(settingStore.animation);
  useEffect(() => {
    mounted = true;
    return () => {
      mounted = false;
      dialog.finish();
    };
  }, []);
  if (!effect) return null;
  return (
    <div
      key={effect.id}
      className={styles.effect}
      role="img"
      aria-label={
        effect.kind === "special"
          ? "特殊召唤"
          : effect.kind === "flip"
          ? "反转召唤"
          : "通常召唤"
      }
      data-testid="duel-summon-effect"
      data-kind={effect.kind}
      style={
        {
          left: `calc(50% + ${effect.x}px)`,
          top: `calc(50% + ${effect.y}px)`,
          color: effect.color,
          "--summon-duration": `${presentationDuration(effect.duration)}ms`,
        } as CSSProperties
      }
    >
      <i className={styles.ring} />
      <i className={styles.glow} />
    </div>
  );
};

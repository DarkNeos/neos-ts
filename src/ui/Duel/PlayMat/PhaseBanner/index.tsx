import { useEffect } from "react";
import { createPortal } from "react-dom";
import { proxy, useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { replayDuration, replayPresentation } from "@/infra/replayPresentation";
import { createDuelDialog } from "@/stores/duelDialogs";
import { settingStore } from "@/stores/settingStore";

import {
  battlePhase,
  drawPhase,
  endPhase,
  mainPhase1,
  mainPhase2,
  standbyPhase,
} from "../labels";
import styles from "./index.module.scss";

import PhaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType;

const phases: Partial<Record<PhaseType, [string, string]>> = {
  [PhaseType.DRAW]: ["DP", drawPhase],
  [PhaseType.STANDBY]: ["SP", standbyPhase],
  [PhaseType.MAIN1]: ["M1", mainPhase1],
  [PhaseType.BATTLE_START]: ["BP", battlePhase],
  [PhaseType.MAIN2]: ["M2", mainPhase2],
  [PhaseType.END]: ["EP", endPhase],
};

export const PHASE_BANNER_DURATION = 650;
const state = proxy<{ phase: PhaseType | null }>({ phase: null });
let timer: ReturnType<typeof setTimeout> | undefined;
const dialog = createDuelDialog(() => {
  clearTimeout(timer);
  state.phase = null;
}, undefined);

export function displayPhaseBanner(phase: PhaseType): Promise<void> {
  dialog.finish();
  // 战斗步骤、伤害步骤等细分阶段不重复播放横幅。
  if (
    replayPresentation.seeking ||
    !phases[phase] ||
    !settingStore.animation.enabled ||
    document.hidden
  )
    return Promise.resolve();
  state.phase = phase;
  const finished = dialog.wait();
  timer = setTimeout(
    () => dialog.finish(),
    replayDuration(PHASE_BANNER_DURATION),
  );
  return finished;
}

export const PhaseBanner = () => {
  const { enabled } = useSnapshot(settingStore.animation);
  const { phase } = useSnapshot(state);
  useEffect(() => () => dialog.finish(), []);
  useEffect(() => {
    if (!enabled) dialog.finish();
  }, [enabled]);
  const label = phase === null ? undefined : phases[phase];
  if (!label) return null;
  return createPortal(
    <div
      key={phase}
      role="status"
      data-testid="duel-phase-banner"
      data-phase={label[0]}
      className={styles.banner}
      style={{
        animationDuration: `${replayDuration(PHASE_BANNER_DURATION)}ms`,
      }}
    >
      <strong>{label[0]}</strong>
      <span>{label[1]}</span>
    </div>,
    document.body,
  );
};

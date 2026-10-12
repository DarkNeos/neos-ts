import { useEffect } from "react";
import { createPortal } from "react-dom";
import { proxy, subscribe, useSnapshot } from "valtio";

import { duelAnimation, presentationDuration } from "@/infra/duelAnimation";
import { replayPresentation } from "@/infra/replayPresentation";
import { createDuelDialog } from "@/stores/duelDialogs";
import { settingStore } from "@/stores/settingStore";

import styles from "./index.module.scss";

export const LIFE_CHANGE_DURATION = duelAnimation.life.change;
interface LifeChangeInfo {
  id: number;
  player: "me" | "op";
  amount: number;
  source?: "cost";
}
const state = proxy<{ change: LifeChangeInfo | null }>({ change: null });
let sequence = 0;
let mounted = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const dialog = createDuelDialog(() => {
  clearTimeout(timer);
  state.change = null;
}, undefined);

export function displayLifeChange(
  isMe: boolean,
  amount: number,
  source?: "cost",
): Promise<void> {
  dialog.finish();
  if (
    replayPresentation.seeking ||
    !mounted ||
    !amount ||
    !settingStore.animation.enabled ||
    document.hidden
  )
    return Promise.resolve();

  state.change = { id: ++sequence, player: isMe ? "me" : "op", amount, source };
  const finished = dialog.wait();
  timer = setTimeout(
    () => dialog.finish(),
    presentationDuration(LIFE_CHANGE_DURATION),
  );
  return finished;
}

export const LifeChange = () => {
  const { change } = useSnapshot(state);
  useSnapshot(settingStore.animation);
  useEffect(() => {
    mounted = true;
    const finishWhenSkipped = () => {
      if (document.hidden || !settingStore.animation.enabled) dialog.finish();
    };
    document.addEventListener("visibilitychange", finishWhenSkipped);
    const unsubscribe = subscribe(
      settingStore.animation,
      finishWhenSkipped,
      true,
    );
    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", finishWhenSkipped);
      unsubscribe();
      dialog.finish();
    };
  }, []);

  if (!change) return null;
  const recovering = change.amount > 0;
  return createPortal(
    <div
      key={change.id}
      className={styles.effect}
      data-testid="duel-life-change"
      data-player={change.player}
      data-kind={
        change.source === "cost" ? "cost" : recovering ? "recover" : "damage"
      }
      data-amount={change.amount}
      style={{
        animationDuration: `${presentationDuration(LIFE_CHANGE_DURATION)}ms`,
      }}
    >
      {!recovering && change.source !== "cost" && (
        <div
          className={styles.impact}
          data-testid="duel-life-damage-flash"
          style={{
            animationDuration: `${presentationDuration(
              duelAnimation.life.flash,
            )}ms`,
          }}
        />
      )}
      <div className={styles.anchor}>
        <strong className={styles.number} role="status">
          {recovering ? "+" : "−"}
          {Math.abs(change.amount)}
        </strong>
      </div>
    </div>,
    document.body,
  );
};

import { subscribe } from "valtio";

import { registerDuelDialogReset } from "@/stores/duelDialogs";
import { settingStore } from "@/stores/settingStore";

import { presentationDuration } from "./duelAnimation";
import { replayPresentation } from "./replayPresentation";

/** 演出停留时间；取消、后台和关闭动画均立即释放等待。 */
export function presentationDelay(duration: number, signal?: AbortSignal) {
  if (
    signal?.aborted ||
    document.hidden ||
    replayPresentation.seeking ||
    !settingStore.animation.enabled
  )
    return Promise.resolve();
  return new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", skip);
      unsubscribe();
      unregister();
      signal?.removeEventListener("abort", finish);
      resolve();
    };
    const skip = () => {
      if (document.hidden || !settingStore.animation.enabled) finish();
    };
    const timer = setTimeout(finish, presentationDuration(duration));
    document.addEventListener("visibilitychange", skip);
    const unsubscribe = subscribe(settingStore.animation, skip, true);
    const unregister = registerDuelDialogReset(finish);
    signal?.addEventListener("abort", finish, { once: true });
  });
}

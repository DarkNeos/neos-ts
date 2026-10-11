import { type SpringConfig, type SpringRef } from "@react-spring/web";
import { subscribe } from "valtio";

import { replayDuration, replayPresentation } from "@/infra/replayPresentation";
import { settingStore } from "@/stores/settingStore";

/** 统一等待动画；后台或定位重建直接设置终态，回放倍速只缩放动画时长。 */
export const asyncStart = <T extends {}>(api: SpringRef<T>) => {
  return (p: Partial<T> & { config?: SpringConfig }) => {
    const { config: _config, ...values } = p;
    if (document.hidden || replayPresentation.seeking) {
      api.set(values as Partial<T>);
      return Promise.resolve();
    }
    if (!settingStore.animation.enabled) {
      return Promise.all(api.start({ ...p, immediate: true })).then(
        () => undefined,
      );
    }
    const finishWhenSkipped = () => {
      // 动画开始后切到后台或关闭演出，也要结束等待，防止消息队列被浏览器节流阻塞。
      if (document.hidden || !settingStore.animation.enabled) {
        api.stop();
        api.set(values as Partial<T>);
      }
    };
    document.addEventListener("visibilitychange", finishWhenSkipped);
    const unsubscribe = subscribe(
      settingStore.animation,
      finishWhenSkipped,
      true,
    );
    const config =
      p.config?.duration === undefined
        ? p.config
        : { ...p.config, duration: replayDuration(p.config.duration) };
    return Promise.all(api.start({ ...p, config, immediate: false }))
      .then(() => undefined)
      .finally(() => {
        document.removeEventListener("visibilitychange", finishWhenSkipped);
        unsubscribe();
      });
  };
};

export function getDuration(): number {
  const MAX_DURATION = 400;
  const { speed } = settingStore.animation;

  return MAX_DURATION - speed * 300;
}

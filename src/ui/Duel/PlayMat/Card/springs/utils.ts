import { type SpringConfig, type SpringRef } from "@react-spring/web";

import { settingStore } from "@/stores/settingStore";

export const asyncStart = <T extends {}>(api: SpringRef<T>) => {
  return (p: Partial<T> & { config?: SpringConfig }) =>
    new Promise((resolve) => {
      api.start({
        ...p,
        onResolve: resolve,
      });
    });
};

export function getDuration(): number {
  const MAX_DURATION = 400;
  const { speed } = settingStore.animation;

  return MAX_DURATION - speed * 300;
}

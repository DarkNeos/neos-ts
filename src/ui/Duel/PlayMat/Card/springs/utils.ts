import { type SpringConfig, type SpringRef } from "@react-spring/web";

import { getCardImgUrl } from "@/ui/Shared";

export const asyncStart = <T extends {}>(api: SpringRef<T>) => {
  return (p: Partial<T> & { config?: SpringConfig }) =>
    new Promise((resolve) => {
      api.start({
        ...p,
        onResolve: resolve,
      });
    });
};

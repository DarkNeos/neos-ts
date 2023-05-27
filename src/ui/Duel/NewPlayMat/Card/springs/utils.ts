import { type SpringConfig, type SpringRef } from "@react-spring/web";

export const asyncStart = <T extends {}>(api: SpringRef<T>) => {
  return (p: Partial<T> & { config: SpringConfig }) =>
    new Promise((resolve) => {
      api.start({
        ...p,
        onRest: resolve,
      });
    });
};

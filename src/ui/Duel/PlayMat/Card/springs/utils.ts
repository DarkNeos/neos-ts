import { type SpringConfig, type SpringRef } from "@react-spring/web";

import type { ygopro } from "@/api";
import { type CardType } from "@/stores";

import type { SpringApi } from "./types";

export const asyncStart = <T extends {}>(api: SpringRef<T>) => {
  return (p: Partial<T> & { config?: SpringConfig }) =>
    new Promise((resolve) => {
      api.start({
        ...p,
        onResolve: resolve,
      });
    });
};

export type MoveFunc = (props: {
  card: CardType;
  api: SpringApi;
  fromZone?: ygopro.CardZone;
}) => Promise<void>;

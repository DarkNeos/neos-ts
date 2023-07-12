import { type SpringConfig, type SpringRef } from "@react-spring/web";

import type { ygopro } from "@/api";
import { type CardType } from "@/stores";
import { getCardImgUrl } from "@/ui/Shared";

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

// >>> preload image >>>
const preloadImageSet = new Set<string>();
export const preloadImage = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (preloadImageSet.has(src)) {
      resolve();
    } else {
      const image = new Image();
      image.onload = async () => {
        await new Promise((r) => setTimeout(r, 100));
        resolve();
        preloadImageSet.add(src);
      };
      image.onerror = reject;
      image.src = src;
    }
  });
export const preloadCardImage = (code: number) =>
  preloadImage(getCardImgUrl(code));

// <<< preload image <<<

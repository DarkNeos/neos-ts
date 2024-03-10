import type { SpringRef } from "@react-spring/web";

import type { ygopro } from "@/api";
import type { CardType } from "@/stores";

export interface SpringApiProps {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  zIndex: number;
  height: number;
  opacity: number;
  // >>> focus
  focusScale: number;
  focusDisplay: string;
  focusOpacity: number;
  // <<< focus

  subZ: number; // 0 -> 100，这是为了让卡片移动过程中，稍微上浮一些，避免一些奇怪的遮挡问题

  config?: Partial<{
    mass: number;
    tension: number;
    friction: number;
    clamp: boolean;
  }>;
}

export type SpringApi = SpringRef<SpringApiProps>;

type OptionsToFunc<Options> = (props: {
  card: CardType;
  api: SpringApi;
  options?: Options;
}) => Promise<void>;

export interface MoveOptions {
  fromZone?: ygopro.CardZone;
}
export type MoveFunc = OptionsToFunc<MoveOptions>;

export type AttackOptions =
  | {
      directAttack: true;
    }
  | { directAttack: false; target: ygopro.CardLocation };
export type AttackFunc = OptionsToFunc<AttackOptions>;

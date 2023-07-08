import { type SpringRef } from "@react-spring/web";

export interface SpringApiProps {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  zIndex: number;
  height: number;
  // >>> focus
  focusScale: number;
  focusDisplay: string;
  focusOpacity: number;
  // <<< focus

  subZ: number; // 0 -> 100，这是为了让卡片移动过程中，稍微上浮一些，避免一些奇怪的遮挡问题
}

export type SpringApi = SpringRef<SpringApiProps>;

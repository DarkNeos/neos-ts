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
}

export type SpringApi = SpringRef<SpringApiProps>;

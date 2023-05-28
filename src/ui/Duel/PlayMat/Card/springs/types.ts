import { type SpringRef, type SpringValue } from "@react-spring/web";

export type SpringApi = SpringRef<{
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  zIndex: number;
  height: number;
}>;

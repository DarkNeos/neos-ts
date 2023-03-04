/*
 * SimpleDuelPlateImpl的一些配置
 *
 * */

import * as BABYLON from "@babylonjs/core";

export const GroundShape = () => {
  return { width: 9.9, height: 8 };
};
export const CardSlotShape = () => {
  return { width: 0.8, height: 1, depth: 0.05 };
};
export const SingleSlotShape = { width: 0.8, height: 1, depth: 0.2 };
export const CardSlotRotation = (reverse: boolean) => {
  return reverse
    ? new BABYLON.Vector3(1.55, 3.1, 0)
    : new BABYLON.Vector3(1.55, 0, 0);
};
export const CardSlotDefenceRotation = () => {
  return new BABYLON.Vector3(1.55, 1.55, 0);
};

// 浮空
export const Floating = 0.02;

// 手牌
export const HandShape = () => {
  return { width: 0.8, height: 1 };
};
export const HandRotation = () => {
  return new BABYLON.Vector3(1, 0, 0);
};
export const HandHoverScaling = () => {
  return new BABYLON.Vector3(1.2, 1.2, 1);
};

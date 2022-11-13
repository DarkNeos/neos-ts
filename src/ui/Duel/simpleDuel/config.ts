/*
 * SimpleDuelPlateImpl的一些配置
 *
 * */

import * as BABYLON from "@babylonjs/core";

export const GroundShape = () => {
  return { width: 6, height: 6 };
};
export const CardSlotShape = () => {
  return { width: 0.5, height: 0.75, depth: 0.05 };
};
export const CardSlotRotation = () => {
  return new BABYLON.Vector3(1.5, 0, 0);
};

// 手牌
export const HandShape = () => {
  return { width: 0.5, height: 0.75 };
};
export const HandColor = () => {
  return BABYLON.Color3.White();
};

// 怪兽区
export const MonsterColor = () => {
  return BABYLON.Color3.Red();
};

// 额外怪兽区
export const extraMonsterColor = () => {
  return BABYLON.Color3.Yellow();
};

// 魔法陷阱区
export const MagicColor = () => {
  return BABYLON.Color3.Blue();
};

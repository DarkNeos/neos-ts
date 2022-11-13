/*
 * SimpleDuelPlateImpl的一些配置
 *
 * */

import * as BABYLON from "@babylonjs/core";

export const GroundShape = { width: 6, height: 6 };
export const CardSlotShape = { width: 0.5, height: 0.75, depth: 0.05 };
export const CardSlotRotation = new BABYLON.Vector3(1.5, 0, 0);

// 手牌
export const HandShape = { width: 0.5, height: 0.75 };
export const HandColor = BABYLON.Color3.White();

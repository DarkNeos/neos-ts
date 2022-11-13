/*
 * 一个简洁的决斗界面实现
 *
 * */

import { IDuelPlate, TypeSelector } from "../duel";
import * as DuelData from "../data";
import { useAppSelector } from "../../../hook";
import React, { useEffect, useRef } from "react";
import type { RootState } from "../../../store";
import * as BABYLON from "@babylonjs/core";
import renderHands from "./hands";

// CONFIG
const GroundShape = { width: 6, height: 6 };
const CardSlotShape = { width: 0.5, height: 0.75, depth: 0.05 };
const CardSlotRotation = new BABYLON.Vector3(1.5, 0, 0);
const HandSlotShape = { width: 0.5, height: 0.75 };

export default class SimpleDuelPlateImpl implements IDuelPlate {
  handsSelector?: TypeSelector<DuelData.Card[]>;

  constructor() {}

  render(): React.ReactElement {
    // ----- 数据获取 -----

    // 默认的手牌Selector，返回三个code为-1的Card。
    const defaultHandsSelector = (_: RootState) => {
      return new Array(5).fill({ code: -1 });
    };
    const hands = useAppSelector(this.handsSelector || defaultHandsSelector);

    // ----- WebGL渲染 -----
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const createCardSlot = (
      name: string,
      position: BABYLON.Vector3,
      color: BABYLON.Color3,
      scene: BABYLON.Scene
    ) => {
      const cardSlot = BABYLON.MeshBuilder.CreateBox(
        name,
        CardSlotShape,
        scene
      );
      cardSlot.position = position;
      cardSlot.rotation = CardSlotRotation;
      const boxMaterail = new BABYLON.StandardMaterial("boxMaterail", scene);
      boxMaterail.diffuseColor = color;
      cardSlot.material = boxMaterail;

      return cardSlot;
    };

    useEffect(() => {
      // 初始化Scene
      const canvasCurrent = canvasRef.current;
      const engine = new BABYLON.Engine(canvasCurrent, true);
      const scene = new BABYLON.Scene(engine);

      // 创建Camera
      const camera = new BABYLON.FreeCamera(
        "camera1",
        new BABYLON.Vector3(0, 5, -10), // 俯视方向
        scene
      );
      camera.setTarget(BABYLON.Vector3.Zero()); // 俯视向前
      camera.attachControl(canvasCurrent, true);

      // 创建光源
      const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(1, 2.5, 1),
        scene
      );
      light.intensity = 0.7;

      // 创建魔法陷阱区
      createCardSlot(
        "cardSlot0",
        new BABYLON.Vector3(-2, 0.5, -3),
        BABYLON.Color3.Blue(),
        scene
      );
      createCardSlot(
        "cardSlot1",
        new BABYLON.Vector3(-1, 0.5, -3),
        BABYLON.Color3.Blue(),
        scene
      );
      createCardSlot(
        "cardSlot2",
        new BABYLON.Vector3(0, 0.5, -3),
        BABYLON.Color3.Blue(),
        scene
      );
      createCardSlot(
        "cardSlot3",
        new BABYLON.Vector3(1, 0.5, -3),
        BABYLON.Color3.Blue(),
        scene
      );
      createCardSlot(
        "cardSlot4",
        new BABYLON.Vector3(2, 0.5, -3),
        BABYLON.Color3.Blue(),
        scene
      );

      // 创建怪兽区
      createCardSlot(
        "cardSlot5",
        new BABYLON.Vector3(-2, 0.5, -2),
        BABYLON.Color3.Red(),
        scene
      );
      createCardSlot(
        "cardSlot6",
        new BABYLON.Vector3(-1, 0.5, -2),
        BABYLON.Color3.Red(),
        scene
      );
      createCardSlot(
        "cardSlot7",
        new BABYLON.Vector3(0, 0.5, -2),
        BABYLON.Color3.Red(),
        scene
      );
      createCardSlot(
        "cardSlot8",
        new BABYLON.Vector3(1, 0.5, -2),
        BABYLON.Color3.Red(),
        scene
      );
      createCardSlot(
        "cardSlot9",
        new BABYLON.Vector3(2, 0.5, -2),
        BABYLON.Color3.Red(),
        scene
      );

      // 创建额外怪兽区
      createCardSlot(
        "cardSlot10",
        new BABYLON.Vector3(-1, 0.5, -1),
        BABYLON.Color3.Yellow(),
        scene
      );
      createCardSlot(
        "cardSlot11",
        new BABYLON.Vector3(1, 0.5, -1),
        BABYLON.Color3.Yellow(),
        scene
      );

      // 创建手牌
      renderHands(hands, scene);

      // 创建地板
      const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        GroundShape,
        scene
      );

      // 渲染循环
      engine.runRenderLoop(() => {
        scene.render();
      });
    }, [canvasRef]);

    return (
      <canvas
        width={window.innerWidth}
        height={window.innerHeight}
        ref={canvasRef}
      />
    );
  }

  registerHands(selector: TypeSelector<DuelData.Card[]>): void {
    this.handsSelector = selector;
  }
}

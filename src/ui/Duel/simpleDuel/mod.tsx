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
import renderMonsters from "./monsters";
import renderExtraMonsters from "./extraMonsters";
import renderMagics from "./magics";
import * as CONFIG from "./config";

// CONFIG

export default class SimpleDuelPlateImpl implements IDuelPlate {
  handsSelector?: TypeSelector<DuelData.Card[]>;

  constructor() {}

  render(): React.ReactElement {
    // ----- 数据获取 -----

    // 默认的手牌Selector，返回五个code为-1的Card。
    const defaultHandsSelector = (_: RootState) => {
      return new Array(5).fill({ code: -1 });
    };
    const hands = useAppSelector(this.handsSelector || defaultHandsSelector);

    // ----- WebGL渲染 -----
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

      // 魔法陷阱区
      renderMagics(scene);
      // 怪兽区
      renderMonsters(scene);

      // 创建额外怪兽区
      renderExtraMonsters(scene);

      // 创建手牌
      renderHands(hands, scene);

      // 创建地板
      const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        CONFIG.GroundShape(),
        scene
      );

      // 渲染循环
      engine.runRenderLoop(() => {
        scene.render();
      });
    }, [canvasRef, hands]);

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

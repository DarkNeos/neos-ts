/*
 * 一个简洁的决斗界面实现
 *
 * */

import { IDuelPlate, TypeSelector } from "../duel";
import { useAppSelector } from "../../../hook";
import React, { useEffect, useRef } from "react";
import type { RootState } from "../../../store";
import * as BABYLON from "@babylonjs/core";
import renderHands from "./hands";
import renderMonsters from "./monsters";
import renderExtraMonsters from "./extraMonsters";
import renderMagics from "./magics";
import * as CONFIG from "./config";
import { store } from "../../../store";
import { CardMeta } from "../../../api/cards";
import { fetchMeHandsMeta } from "../../../reducers/duel/handsSlice";

// CONFIG

export default class SimpleDuelPlateImpl implements IDuelPlate {
  handsSelector?: TypeSelector<CardMeta[]>;

  constructor() {}

  render(): React.ReactElement {
    const dispatch = store.dispatch;

    // ----- 数据获取 -----

    // 默认的手牌Selector，返回五个code为-1的Card。
    const defaultHandsSelector = (_: RootState) => {
      return [];
    };
    const hands = useAppSelector(this.handsSelector || defaultHandsSelector);
    // TODO: 每次hands更新的时候，需要更新meta数据
    const ids = hands.map((hand) => {
      return hand.id;
    });
    dispatch(fetchMeHandsMeta(ids));

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

  registerHands(selector: TypeSelector<CardMeta[]>): void {
    this.handsSelector = selector;
  }
}

/*
 * 一个简洁的决斗界面实现
 *
 * */

import { IDuelPlate, TypeSelector } from "../duel";
import { useAppSelector } from "../../../hook";
import React, { useEffect, useRef } from "react";
import { RootState, observeStore } from "../../../store";
import * as BABYLON from "@babylonjs/core";
import renderHands from "./hands";
import renderMonsters from "./monsters";
import renderExtraMonsters from "./extraMonsters";
import renderMagics from "./magics";
import renderDeck from "./deck";
import renderCemetery from "./cemetery";
import renderExclusion from "./exclusion";
import renderField from "./field";
import * as CONFIG from "../../../config/ui";
import { Card } from "../../../reducers/duel/util";
import { selectCurrentPlayer } from "../../../reducers/duel/turnSlice";
import { selectCurrentPhase } from "../../../reducers/duel/phaseSlice";

// CONFIG

export default class SimpleDuelPlateImpl implements IDuelPlate {
  handsSelector?: TypeSelector<Card[]>;

  constructor() {}

  render(): React.ReactElement {
    // ----- 数据获取 -----

    // 默认的手牌Selector，返回五个code为-1的Card。
    const defaultHandsSelector = (_: RootState) => {
      return new Array(5).fill({ id: 10000, data: {}, text: {} });
    };
    const hands = useAppSelector(this.handsSelector || defaultHandsSelector);
    const currentPlayer = useAppSelector(selectCurrentPlayer);
    const currentPhase = useAppSelector(selectCurrentPhase);

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
        new BABYLON.Vector3(0, 8, -10), // 俯视方向
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

      // 创建卡组
      renderDeck(scene);

      // 创建墓地
      renderCemetery(scene);

      // 创建除外区
      renderExclusion(scene);

      // 创建场地
      renderField(scene);

      // 创建地板
      const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        CONFIG.GroundShape(),
        scene
      );
      const groundMaterial = new BABYLON.StandardMaterial(
        "groundMaterial",
        scene
      );
      groundMaterial.diffuseTexture = new BABYLON.Texture(
        `http://localhost:3030/images/newfield.png`
      );
      groundMaterial.diffuseTexture.hasAlpha = true;
      ground.material = groundMaterial;

      /* 一些未处理的逻辑，在这里用日志打印出来 */

      // 当前操作玩家
      console.log(`currentPlayer:` + currentPlayer);
      // 当前阶段
      console.log(`currentPhase:` + currentPhase);

      // 渲染循环
      engine.runRenderLoop(() => {
        scene.render();
      });
    }, [canvasRef, hands, currentPlayer]);

    useEffect(() => {
      // 监听状态变化，并实现动画

      const onHandsChange = (prev_hands: Card[] | null, cur_hands: Card[]) => {
        console.log(prev_hands, "change to", cur_hands);
      };

      const unsubscribe = observeStore(
        this.handsSelector || defaultHandsSelector,
        onHandsChange
      );
      return () => {
        // 取消监听
        unsubscribe();
      };
    }, []);

    return (
      <canvas
        width={window.innerWidth}
        height={window.innerHeight}
        ref={canvasRef}
      />
    );
  }

  registerHands(selector: TypeSelector<Card[]>): void {
    this.handsSelector = selector;
  }
}

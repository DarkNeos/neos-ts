/*
 * 决斗界面的抽象接口
 *
 * - Neos项目采用UI渲染和数据获取相互解耦的设计，
 *   UI组件内部不应该存在任何与业务耦合的逻辑，
 *   而是应该暴露数据注入的接口，供业务方调用；
 * - Neos项目在研发初期，会更多的注重业务逻辑的实现，
 *   而不会在UI界面上钻研过深，但在项目最终上线前，
 *   会对UI界面提出较高的要求，因此在研发过程中可能会存在
 *   多套UI界面。为了减少重复性工作，这里设计一个通用的
 *   决斗界面抽象接口，接口实现方需要实现独立的，具体的渲染逻辑，
 *   接口调用方不感知具体实现，只负责根据外部输入，
 *   进行特定UI模块的渲染和更新。
 *
 *   */

import React from "react";
import type { RootState } from "../../store";
import { Card } from "../../api/cards";

/*
 * 通用的决斗界面抽象接口
 *
 * */
export interface IDuelPlate {
  // 渲染接口，返回一个React组件
  render(): React.ReactElement;
  // 注册手牌selector
  registerHands(selector: TypeSelector<Card[]>): void;
}

export interface TypeSelector<T> {
  (state: RootState): T;
}

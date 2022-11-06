/*
 * 一个简洁的决斗界面实现
 *
 * */

import { IDuelPlate, TypeSelector } from "./duel";
import * as DuelData from "./data";
import { useAppSelector } from "../../hook";
import React from "react";
import type { RootState } from "../../store";

export default class SimpleDuelPlateImpl implements IDuelPlate {
  handsSelector?: TypeSelector<DuelData.Card[]>;

  constructor() {}

  render(): React.ReactElement {
    // 默认的手牌Selector，返回三个code为-1的Card。
    const defaultHandsSelector = (_: RootState) => {
      return new Array(5).fill({ code: -1 });
    };
    const hands = useAppSelector(this.handsSelector || defaultHandsSelector);

    return (
      <div>
        <table border={1}>
          <tr>
            {hands.map((hand) => (
              <td>{hand.code}</td>
            ))}
          </tr>
        </table>
      </div>
    );
  }

  registerHands(selector: TypeSelector<DuelData.Card[]>): void {
    this.handsSelector = selector;
  }
}

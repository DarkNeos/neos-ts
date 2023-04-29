import "@/styles/mat.css";

import React from "react";
import { useSnapshot } from "valtio";

import { CardState, DuelFieldState, matStore } from "@/stores";

import { BlockRow, ExtraBlockRow } from "./Block";
import { Menu } from "./Menu";

export const Mat = () => {
  const snap = useSnapshot(matStore);
  const monsters = snap.monsters;
  const magics = snap.magics;

  return (
    <>
      <Menu />
      <div id="life-bar-container">
        <div id="life-bar">{snap.initInfo.me.life}</div>
        <div id="life-bar">{snap.initInfo.op.life}</div>
      </div>
      <div id="camera">
        <div id="board">
          <div id="board-bg">
            <BlockRow states={magics.op.slice(0, 5) as DuelFieldState} />
            <BlockRow
              states={monsters.op.slice(0, 5) as DuelFieldState}
              rightState={magics.op[5] as CardState}
            />
            <ExtraBlockRow
              meLeft={monsters.me[5] as CardState}
              meRight={monsters.me[6] as CardState}
              opLeft={monsters.op[5] as CardState}
              opRight={monsters.op[6] as CardState}
            />
            <BlockRow
              states={monsters.me.slice(0, 5) as DuelFieldState}
              leftState={magics.me[5] as CardState}
            />
            <BlockRow states={magics.me.slice(0, 5) as DuelFieldState} />
          </div>
        </div>
      </div>
    </>
  );
};

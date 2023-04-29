import "@/styles/mat.css";

import React from "react";
import { useSnapshot } from "valtio";

import { DuelFieldState, matStore } from "@/stores";

import { Block } from "./Block";
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
          <div id="borad-bg">
            <BlockRow states={magics.op.slice(0, 5) as DuelFieldState} />
            <BlockRow states={monsters.op.slice(0, 5) as DuelFieldState} />
            <BlockRow
              states={monsters.op.slice(5, 7) as DuelFieldState}
              isExtra={true}
            />
            <BlockRow
              states={monsters.me.slice(5, 7) as DuelFieldState}
              isExtra={true}
            />
            <BlockRow states={monsters.me.slice(0, 5) as DuelFieldState} />
            <BlockRow states={magics.me.slice(0, 5) as DuelFieldState} />
          </div>
        </div>
      </div>
    </>
  );
};

function BlockRow<T extends DuelFieldState>(props: {
  states: T;
  isExtra?: boolean;
}) {
  return (
    <div className="block-row">
      {props.states.map((block, idx) => (
        <Block
          key={idx}
          isExtra={props.isExtra}
          highlight={block.placeInteractivity !== undefined}
          onClick={() => {
            // TODO
          }}
        />
      ))}
    </div>
  );
}

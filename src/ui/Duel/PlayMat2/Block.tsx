import "@/styles/mat.css";

import classnames from "classnames";
import React, { MouseEventHandler } from "react";

import { CardState, DuelFieldState } from "@/stores";

export const Block: React.FC<{
  isExtra?: boolean;
  highlight?: boolean;
  onClick?: MouseEventHandler;
}> = ({ isExtra = false, highlight = false, onClick }) => (
  <div
    className={classnames("block", {
      "block-extra": isExtra,
    })}
    style={
      {
        "--highlight-on": highlight ? 1 : 0,
      } as any
    }
    onClick={onClick}
  />
);

export function BlockRow<T extends DuelFieldState>(props: { states: T }) {
  return (
    <div className="block-row">
      {props.states.map((block, idx) => (
        <Block
          key={idx}
          highlight={block.placeInteractivity !== undefined}
          onClick={() => {
            // TODO
          }}
        />
      ))}
    </div>
  );
}

export const ExtraBlockRow: React.FC<{
  meLeft: CardState;
  meRight: CardState;
  opLeft: CardState;
  opRight: CardState;
}> = ({ meLeft, meRight, opLeft, opRight }) => (
  <div className="block-row">
    <Block
      highlight={
        meLeft.placeInteractivity !== undefined ||
        opLeft.placeInteractivity !== undefined
      }
      isExtra={true}
      onClick={() => {
        // TODO
      }}
    />
    <Block
      highlight={
        meRight.placeInteractivity !== undefined ||
        opRight.placeInteractivity !== undefined
      }
      isExtra={true}
      onClick={() => {
        // TODO
      }}
    />
  </div>
);

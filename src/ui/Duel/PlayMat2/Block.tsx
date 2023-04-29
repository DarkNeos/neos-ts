import "@/styles/mat.css";

import classnames from "classnames";
import React, { MouseEventHandler } from "react";

import { CardState, DuelFieldState } from "@/stores";

export const Block: React.FC<{
  isExtra?: boolean;
  highlight?: boolean;
  onClick?: MouseEventHandler;
  outerLeft?: boolean;
  outerRight?: boolean;
}> = ({
  isExtra = false,
  highlight = false,
  onClick,
  outerLeft = false,
  outerRight = false,
}) => (
  <div
    className={classnames("block", {
      "block-extra": isExtra,
      "block-left": outerLeft,
      "block-right": outerRight,
    })}
    style={
      {
        "--highlight-on": highlight ? 1 : 0,
      } as any
    }
    onClick={onClick}
  />
);

export function BlockRow<T extends DuelFieldState>(props: {
  states: T;
  leftState?: CardState;
  rightState?: CardState;
}) {
  return (
    <div className="block-row">
      {props.leftState ? (
        <Block
          highlight={props.leftState.placeInteractivity !== undefined}
          onClick={() => {}}
          outerLeft
        />
      ) : (
        <></>
      )}
      {props.states.map((block, idx) => (
        <Block
          key={idx}
          highlight={block.placeInteractivity !== undefined}
          onClick={() => {
            // TODO
          }}
        />
      ))}
      {props.rightState ? (
        <Block
          highlight={props.rightState.placeInteractivity !== undefined}
          onClick={() => {}}
          outerRight
        />
      ) : (
        <></>
      )}
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

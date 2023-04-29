import "@/styles/mat.css";

import classnames from "classnames";
import React, { MouseEventHandler } from "react";

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

import "@/styles/mat.css";

import classnames from "classnames";
import React from "react";

export const Block: React.FC<{
  isExtra?: boolean;
  highlight?: boolean;
}> = ({ isExtra = false, highlight = false }) => (
  <div
    className={classnames("block", {
      "block-extra": isExtra,
    })}
    style={
      {
        "--highlight-on": highlight ? 1 : 0,
      } as any
    }
  />
);

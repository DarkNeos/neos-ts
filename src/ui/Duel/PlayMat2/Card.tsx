import "@/styles/mat.css";

import classnames from "classnames";
import React, { type CSSProperties, MouseEventHandler } from "react";

import { useConfig } from "@/config";

const NeosConfig = useConfig();

export const Card: React.FC<{
  code: number;
  row?: number;
  col?: number;
  hight?: number;
  opponent?: boolean;
  defense?: boolean;
  facedown?: boolean;
  vertical?: boolean;
  highlight?: boolean;
  fly?: boolean;
  transTime?: number;
  onClick?: MouseEventHandler<{}>;
  style?: CSSProperties;
}> = ({
  code,
  row = 0,
  col = 0,
  hight = 1,
  defense = false,
  facedown = false,
  opponent = false,
  vertical = false,
  highlight = false,
  fly = false,
  transTime = 0.3,
  onClick,
  style = {},
}) => (
  <div
    className={classnames("card", {
      "card-defense": defense,
      fly,
    })}
    style={
      {
        "--h": hight,
        "--r": row,
        "--c": col,
        "--shadow": hight > 0 ? 1 : 0,
        "--opponent-deg": opponent ? "180deg" : "0deg",
        "--vertical": vertical ? 1 : 0,
        "--trans-time": `${transTime}s`,
        "--highlight-on": highlight ? 1 : 0,
        "--card-img": facedown
          ? `url(${NeosConfig.assetsPath + "/card_back.jpg"})`
          : `url(${NeosConfig.cardImgUrl + "/" + code + ".jpg"})`,
        ...style,
      } as any
    }
    onClick={onClick}
  ></div>
);

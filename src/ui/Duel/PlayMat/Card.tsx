import "@/styles/mat.css";

import classnames from "classnames";
import React, { type CSSProperties, MouseEventHandler } from "react";

import { useConfig } from "@/config";

import { Chain } from "./Chain";

const NeosConfig = useConfig();

const ASSETS_BASE =
  import.meta.env.BASE_URL == "/"
    ? NeosConfig.assetsPath
    : import.meta.env.BASE_URL + NeosConfig.assetsPath;

const FOCUS_SCALE = 2.5;
const FOCUS_HIGHT = 100;

export const Card: React.FC<{
  code: number;
  row: number;
  col: number;
  hight: number;
  opponent?: boolean;
  defense?: boolean;
  facedown?: boolean;
  vertical?: boolean;
  highlight?: boolean;
  focus?: boolean;
  fly?: boolean;
  chainIdx?: number;
  transTime?: number;
  onClick?: MouseEventHandler<{}>;
  style?: CSSProperties;
}> = ({
  code,
  row,
  col,
  hight,
  defense = false,
  facedown = false,
  opponent = false,
  vertical = false,
  highlight = false,
  focus = false,
  fly = false,
  chainIdx,
  transTime = 0.3,
  onClick,
  style = {},
}) => (
  <div
    className={classnames("card", {
      "card-defense": defense,
      fly: fly && !focus,
    })}
    style={
      {
        "--h": focus ? FOCUS_HIGHT : hight,
        "--r": row,
        "--c": col,
        "--shadow": hight > 0 ? 1 : 0,
        "--opponent-deg": opponent ? "180deg" : "0deg",
        "--vertical": vertical ? 1 : 0,
        "--trans-time": `${
          fly ? NeosConfig.ui.chainingDelay / 1000 : transTime
        }s`,
        "--highlight-on": highlight ? 1 : 0,
        "--scale-focus": focus ? FOCUS_SCALE : 1,
        "--card-img": facedown
          ? `url(${ASSETS_BASE + "/card_back.jpg"})`
          : `url(${NeosConfig.cardImgUrl + "/" + code + ".jpg"})`,
        ...style,
      } as any
    }
    onClick={onClick}
  >
    {chainIdx ? <Chain chainIdx={chainIdx} /> : <></>}
  </div>
);

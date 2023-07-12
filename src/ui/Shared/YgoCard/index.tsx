import "./index.scss";

import classNames from "classnames";
import { CSSProperties, useMemo } from "react";

import { useConfig } from "@/config";

interface Props {
  className?: string;
  isBack?: boolean;
  code?: number;
  style?: CSSProperties;
  width?: number;
  onClick?: () => void;
}

export const YgoCard: React.FC<Props> = (props) => {
  const {
    className,
    code = 0,
    isBack = false,
    width = 80,
    style,
    onClick = () => {},
  } = props;
  return useMemo(
    () => (
      <img
        className={classNames("ygo-card", className)}
        src={getCardImgUrl(code, isBack)}
        style={{ width, ...style }}
        onClick={onClick}
      />
    ),
    [code]
  );
};

const NeosConfig = useConfig();

export function getCardImgUrl(code: number, back = false) {
  const ASSETS_BASE =
    import.meta.env.BASE_URL === "/"
      ? NeosConfig.assetsPath
      : `${import.meta.env.BASE_URL}${NeosConfig.assetsPath}`;
  if (back || code === 0) {
    return `${ASSETS_BASE}/card_back.jpg`;
  }
  return `${NeosConfig.cardImgUrl}/${code}.jpg`;
}

import { type FC, useMemo, CSSProperties } from "react";

import { useConfig } from "@/config";

import classNames from "classnames";
import "./index.scss";

interface Props {
  className?: string;
  isBack?: boolean;
  code?: number;
  style?: CSSProperties;
}

export const YgoCard: FC<Props> = (props) => {
  const { className, code: cardCode = 0, isBack = false, style } = props;
  return useMemo(
    () => (
      <>
        {cardCode === 0 && !isBack ? (
          <div
            className={classNames("ygo-card", "skeleton-cover")}
            style={style}
          />
        ) : (
          <img
            className={classNames("ygo-card", className)}
            src={getCardImgUrl(cardCode, isBack)}
            style={style}
          />
        )}
      </>
    ),
    [cardCode]
  );
};

const NeosConfig = useConfig();

function getCardImgUrl(code: number, back = false) {
  const ASSETS_BASE =
    import.meta.env.BASE_URL == "/"
      ? NeosConfig.assetsPath
      : `${import.meta.env.BASE_URL}${NeosConfig.assetsPath}`;
  if (back) {
    return `${ASSETS_BASE}/card_back.jpg`;
  }
  return `${NeosConfig.cardImgUrl}/${code}.jpg`;
}

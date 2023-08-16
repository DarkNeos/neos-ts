import classNames from "classnames";
import { CSSProperties, useMemo } from "react";

import { useConfig } from "@/config";

import styles from "./index.module.scss";

interface Props {
  className?: string;
  isBack?: boolean;
  code?: number;
  cardName?: string;
  style?: CSSProperties;
  width?: number;
  onClick?: () => void;
  onLoad?: () => void;
}

export const YgoCard: React.FC<Props> = (props) => {
  const {
    className,
    code = 0,
    cardName,
    isBack = false,
    width,
    style,
    onClick,
    onLoad,
  } = props;
  return useMemo(
    () => (
      <div
        className={classNames(styles["ygo-card"], className)}
        style={
          {
            width,
            "--src": `url(${getCardImgUrl(code, isBack)})`,
            ...style,
          } as any
        }
        onClick={onClick}
        // 加载完成
        onLoad={onLoad}
      >
        {/* 暂时不能这么写...但如果用onload的话来判断可能又很消耗性能，再看看吧 */}
        {/* {cardName} */}
      </div>
    ),
    [code],
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

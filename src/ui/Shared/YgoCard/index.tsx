import classNames from "classnames";
import { CSSProperties, useEffect, useState } from "react";

import { useConfig } from "@/config";
import { isSuperReleaseCard } from "@/superPreRelease";

import styles from "./index.module.scss";

interface Props {
  className?: string;
  isBack?: boolean;
  code?: number;
  // cardName?: string;
  style?: CSSProperties;
  width?: number | string;
  onClick?: () => void;
  onLoad?: () => void;
}

export const YgoCard: React.FC<Props> = (props) => {
  const {
    className,
    code = 0,
    isBack = false,
    width,
    style,
    onClick,
    onLoad,
  } = props;

  const [src, setSrc] = useState(
    "https://img2.imgtp.com/2024/03/06/G6wTJRz9.png",
  );

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      console.timeEnd(code.toString());
      setSrc(img.src); // 图片加载完成后更新src状态
    };
    // 直接设置图片路径，无需url()包裹
    img.src = getCardImgUrl(code, isBack);
    console.time(code.toString());
  }, [code, isBack]); // useEffect的依赖数组中加入isBack

  return (
    <div
      className={classNames(styles["ygo-card"], className)}
      style={
        {
          width,
          "--src": `url(${src})`,
          ...style,
        } as any
      }
      onClick={onClick}
      onLoad={onLoad}
    ></div>
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

  if (isSuperReleaseCard(code)) {
    return `${NeosConfig.preReleaseImgUrl}/${code}.jpg`;
  } else {
    return `${NeosConfig.releaseImgUrl}/${code}.jpg`;
  }
}

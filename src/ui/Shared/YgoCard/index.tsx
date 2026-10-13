import classNames from "classnames";
import { CSSProperties } from "react";

import { getCardImgUrl } from "@/api";
import { useConfig } from "@/config";

import styles from "./index.module.scss";

const { assetsPath } = useConfig();

interface Props {
  className?: string;
  isBack?: boolean;
  backSrc?: string;
  code?: number;
  targeted?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  width?: number | string;
  loading?: "eager" | "lazy";
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

export const YgoCard: React.FC<Props> = ({
  className,
  code = 0,
  isBack = false,
  backSrc,
  targeted = false,
  disabled = false,
  width,
  style,
  loading = "eager",
  onClick,
  onLoad,
  onError,
}) => {
  const showingBack = isBack || code === 0;
  const src = showingBack && backSrc ? backSrc : getCardImgUrl(code, isBack);

  return (
    <div
      className={classNames(styles["ygo-card"], className)}
      style={{ width, ...style }}
      onClick={onClick}
    >
      <img
        key={src}
        className={classNames(styles.image, {
          [styles["back-image"]]: showingBack,
        })}
        src={src}
        alt=""
        loading={loading}
        decoding="async"
        draggable={false}
        onLoad={onLoad}
        onError={(event) => {
          // 自定义卡背失败时只回退一次；默认卡背出错不重复设置同一地址。
          if (backSrc && event.currentTarget.getAttribute("src") === backSrc)
            event.currentTarget.src = getCardImgUrl(0, true);
          onError?.();
        }}
      />
      {targeted && (
        <div className={styles.targeted}>
          <img src={`${assetsPath}/targeted.png`} alt="" />
        </div>
      )}
      {disabled && (
        <div className={styles.disabled}>
          <img src={`${assetsPath}/disabled.png`} alt="" />
        </div>
      )}
    </div>
  );
};

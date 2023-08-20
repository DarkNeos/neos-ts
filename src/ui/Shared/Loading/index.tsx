import { LoadingOutlined } from "@ant-design/icons";

import styles from "./index.module.scss";

/**
 * 加载中
 * @param progress 0~1的进度
 * @param hiddenText 是否隐藏文字
 */
export const Loading: React.FC<{ progress?: number; hiddenText?: boolean }> = ({
  progress,
  hiddenText,
}) => (
  <div className={styles.loading}>
    <span className={styles.icon}>
      <LoadingOutlined />
    </span>
    {!hiddenText && (
      <span className={styles.text}>
        {progress ? `${progress.toFixed(2)}%` : "加载中"}
      </span>
    )}
  </div>
);

import { LoadingOutlined } from "@ant-design/icons";

import styles from "./index.module.scss";

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
        {progress ? `${progress}%` : "加载中"}
      </span>
    )}
  </div>
);

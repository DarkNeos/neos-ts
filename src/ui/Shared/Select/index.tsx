import { Select as AntdSelect } from "antd";
import classNames from "classnames";

import styles from "./index.module.scss";

export const Select: React.FC<
  React.ComponentProps<typeof AntdSelect> & { title?: string }
> = ({ title, className, dropdownStyle, size = "middle", ...rest }) => (
  <div
    className={classNames(styles["custom-select"], {
      [styles.small]: size === "small",
    })}
  >
    {title && <span className={styles.prefix}>{title}</span>}
    <AntdSelect
      className={classNames(styles.select, className)}
      size={size}
      popupMatchSelectWidth={false}
      popupClassName={styles.popup}
      dropdownStyle={{
        backdropFilter: "blur(20px)",
        minWidth: 160,
        maxWidth: "calc(100vw - 24px)",
        ...dropdownStyle,
      }}
      {...rest}
    />
  </div>
);

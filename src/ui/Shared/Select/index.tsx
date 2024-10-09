import { Select as AntdSelect } from "antd";
import classNames from "classnames";

import styles from "./index.module.scss";

export const Select: React.FC<
  React.ComponentProps<typeof AntdSelect> & { title?: string }
> = ({ title, className, dropdownStyle, ...rest }) => (
  <div className={styles["custom-select"]}>
    {title && <span className={styles.prefix}>{title}</span>}
    <AntdSelect
      className={classNames(styles.select, className)}
      size="middle"
      dropdownStyle={{
        backdropFilter: "blur(20px)",
        ...dropdownStyle,
      }}
      {...rest}
    />
  </div>
);

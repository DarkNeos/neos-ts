import { ConfigProvider, Select as AntdSelect } from "antd";
import classNames from "classnames";

import styles from "./index.module.scss";

export const Select: React.FC<
  React.ComponentProps<typeof AntdSelect> & { title: string }
> = ({ title, className, dropdownStyle, ...rest }) => (
  <ConfigProvider
    theme={{
      components: {
        Select: {
          colorBgElevated: "hsla(0, 0%, 100%, 0.05)",
          controlItemBgActive: "#79797955",
          colorBorder: "transparent",
          colorBgContainer: "hsla(0, 0%, 100%, 0.05)",
          colorPrimaryHover: "#3400d1",
          lineWidth: 0,
        },
      },
    }}
  >
    <div className={styles["custom-select"]}>
      <span className={styles.prefix}>{title}</span>
      <AntdSelect
        className={classNames(styles.select, className)}
        size="large"
        dropdownStyle={{
          backdropFilter: "blur(20px)",
          ...dropdownStyle,
        }}
        {...rest}
      />
    </div>
  </ConfigProvider>
);

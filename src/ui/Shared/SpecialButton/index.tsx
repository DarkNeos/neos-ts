import classNames from "classnames";

import styles from "./index.module.scss";

// TODO: SpecialButton能不能做个Loading？
export const SpecialButton: React.FC<
  React.PropsWithChildren<React.ComponentProps<"span">> & {
    disabled?: boolean;
  }
> = ({ children, className, disabled, ...rest }) => (
  <span
    className={classNames(styles["special-btn"], className, {
      [styles.disabled]: disabled,
    })}
    {...rest}
  >
    {children}
  </span>
);

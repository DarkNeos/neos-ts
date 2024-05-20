import classNames from "classnames";

import styles from "./index.module.scss";

// TODO: SpecialButton能不能做个Loading？
export const SpecialButton: React.FC<
  React.PropsWithChildren<React.ComponentProps<"span">> & {
    disabled?: boolean;
  }
> = ({ children, className, disabled, ...rest }) => {
  // 这里的音效有滞后，暂时先注释掉，后面再来修复这个问题
  /*
  const [effectRef] = usePlayEffect<HTMLSpanElement>(
    AudioActionType.SOUND_BUTTON,
  );
  */
  return (
    <span
      // ref={effectRef}
      className={classNames(styles["special-btn"], className, {
        [styles.disabled]: disabled,
      })}
      {...rest}
    >
      {children}
    </span>
  );
};

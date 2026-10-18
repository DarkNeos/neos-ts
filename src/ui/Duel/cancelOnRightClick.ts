import type { MouseEventHandler } from "react";

/** 复用对局弹窗的取消操作，不把右键传给其他弹窗或底层场地。 */
export const cancelOnRightClick = (
  cancel?: () => void,
): MouseEventHandler<HTMLDivElement> => {
  return (event) => {
    // Portal 可能沿 React 树冒泡，只处理当前弹窗 DOM 内的操作。
    if (
      !(event.target instanceof Node) ||
      !event.currentTarget.contains(event.target)
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    cancel?.();
  };
};

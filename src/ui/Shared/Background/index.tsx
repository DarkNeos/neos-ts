import { useEffect } from "react";
import { createRoot } from "react-dom/client";

import styles from "./index.module.scss";

/** HOC: 将组件发射到body下 */
export const withPortalToBody = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
) => {
  return (props: P) => {
    useEffect(() => {
      // 创建一个新的容器元素
      const portalRoot = document.body;
      const firstChild = portalRoot.firstChild;
      const newNode = document.createElement("div");
      portalRoot.insertBefore(newNode, firstChild);

      const root = createRoot(newNode);
      // 渲染组件到新的容器中
      root.render(<WrappedComponent {...props} />);

      return () => {
        // 卸载组件并且移除容器
        setTimeout(() => root.unmount());
        if (portalRoot.contains(newNode)) {
          // 做个if判断，防止下面这行crash
          portalRoot.removeChild(newNode);
        }
      };
    }, []);

    return null; // 返回null，避免在原来的位置渲染任何东西
  };
};

export const Background: React.FC<{
  style?: React.CSSProperties;
  innerStyle?: React.CSSProperties;
  innerOpacity?: number;
}> = withPortalToBody(({ style, innerStyle, innerOpacity = 1 }) => {
  return (
    <div className={styles.background} style={style}>
      <div
        className={styles.inner}
        style={{ ...innerStyle, opacity: innerOpacity }}
      ></div>
    </div>
  );
});

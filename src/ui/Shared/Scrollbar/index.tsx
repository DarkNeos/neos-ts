import {
  OverlayScrollbarsComponent,
  OverlayScrollbarsComponentProps,
  type OverlayScrollbarsComponentRef,
} from "overlayscrollbars-react";
import { forwardRef } from "react";

/**
 * @desc 创建漂亮的滚动条，包裹一些可能溢出的元素。
 * @why chrome在113之后，取消了overflow: overlay的支持，所以需要使用overlayScrollbars来实现。
 */
export const ScrollableArea = forwardRef<
  OverlayScrollbarsComponentRef<"div">,
  React.PropsWithChildren<{
    scrollProps?: OverlayScrollbarsComponentProps;
    elementProps?: React.HTMLAttributes<HTMLElement>;
    className?: string;
    style?: React.CSSProperties;
  }>
>(({ scrollProps = {}, elementProps, className, style, children }, ref) => {
  const { options = {}, ...rest } = scrollProps;

  return (
    <OverlayScrollbarsComponent
      options={{
        scrollbars: {
          autoHide: "scroll",
          theme: "os-theme-light",
        },
        overflow: {
          x: "hidden",
          y: "scroll",
        },
        ...options,
      }}
      defer
      style={{
        height: "100%",
      }}
      {...rest}
      ref={ref}
    >
      <div className={className} style={style} {...elementProps}>
        {children}
      </div>
    </OverlayScrollbarsComponent>
  );
});

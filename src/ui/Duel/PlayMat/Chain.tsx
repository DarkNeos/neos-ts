import "@/styles/chain.css";

import React from "react";

const CIRCLES_COUNT = 10;
const EASE = 0.2;
const R = 60;

export const Chain: React.FC<{ chainIdx: number }> = (props: {
  chainIdx: number;
}) => (
  <div
    className="circles"
    style={
      {
        "--R": R + "px",
      } as any
    }
  >
    {calcXYs(30, CIRCLES_COUNT).map((item, idx) => (
      <div
        className="circle"
        key={idx}
        style={
          {
            "--x": item.X + "px",
            "--y": item.Y + "px",
            "--ease": (idx * EASE).toString() + "s",
          } as any
        }
      ></div>
    ))}
    <div className="font">{props.chainIdx}</div>
  </div>
);

// Ref: https://zhuanlan.zhihu.com/p/104226591
/**
 * R:大圆半径，2*R = 外部正方形的边长
 * counts: 圆的数量
 * 返回值：
 *  [
 *    [x1,y1],
 *    [x2,y2],
 *    ...
 *  ]
 */
function calcXYs(R: number, counts: number) {
  // 当前度数
  let deg = 0;
  // 单位度数
  let pDeg = 360 / counts;
  return Array(counts)
    .fill(0)
    .map((_, i) => {
      // 度数以单位度数递增
      deg = pDeg * i;
      // Math.sin接收的参数以 π 为单位，需要根据360度 = 2π进行转化
      const proportion = Math.PI / 180;
      // 以外部DIV左下角为原点，计算小圆圆心的横纵坐标
      const Y = R + R * Math.sin(proportion * deg);
      const X = R + R * Math.cos(proportion * deg);

      return { X, Y, deg };
    });
}

import { createFromIconfontCN } from "@ant-design/icons";

const _IconFont = createFromIconfontCN({
  scriptUrl: ["//at.alicdn.com/t/c/font_4188978_m65y344sn8h.js"],
});

export const IconFont: React.FC<{
  type: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ type, size = "inherit", style, color = "inherit" }) => (
  <_IconFont type={type} style={{ fontSize: size, color, ...style }} />
);

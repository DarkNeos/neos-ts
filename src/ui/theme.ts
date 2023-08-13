import { theme as antdTheme, type ThemeConfig } from "antd";

export const theme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: "#0085da",
  },
  components: {
    Message: {
      colorBgElevated: "#3f4d60",
      boxShadow:
        "0 6px 16px 0 rgb(51 51 51 / 80%), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
    },
    Modal: {
      colorBgElevated: "#1f2531",
      paddingMD: 24,
      paddingContentHorizontalLG: 36,
    },
    Select: {
      colorBgElevated: "hsla(0, 0%, 20%, 0.3)",
      controlItemBgActive: "#79797955",
      colorBorder: "transparent",
      colorBgContainer: "hsla(0, 0%, 100%, 0.05)",
      colorPrimaryHover: "#3400d1",
      lineWidth: 0,
    },
    InputNumber: {
      colorBorder: "transparent",
      lineWidth: 0,
      colorBgContainer: "hsla(0, 0%, 100%, 0.05)",
    },
    Dropdown: {
      colorBgElevated: "#2e3c50",
      boxShadow:
        "0 6px 16px 0 rgb(51 51 51 / 80%), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
    },
    Pagination: {
      lineWidth: 0,
      colorBgContainer: "hsla(0, 0%, 100%, 0.05)",
    },
    Layout: {
      colorBgBody: "transparent",
    },
  },
};

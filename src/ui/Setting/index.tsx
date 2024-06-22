import { ConfigProvider, Modal, Tabs, TabsProps } from "antd";
import zhCN from "antd/locale/zh_CN";
import React from "react";
import { render, unmountComponentAtNode } from "react-dom";

import { theme } from "../theme";
import { AudioSetting } from "./Audio";

/** 设置面板属性 */
export interface SettingProps {
  /** 默认设置页 */
  defaultKey?: "audio" | "other";
}

export const Setting = (props: SettingProps) => {
  const { defaultKey = "audio" } = props;

  const items: TabsProps["items"] = [
    {
      key: "audio",
      label: "音频设置",
      children: <AudioSetting />,
    },
  ];

  return <Tabs defaultActiveKey={defaultKey} items={items} />;
};

/**
 * 打开设置面板，允许在非组件内通过此 API 打开设置面板
 */
export function openSettingPanel(props: SettingProps) {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const destroy = () => {
    const result = unmountComponentAtNode(div);
    if (result && div.parentNode) {
      div.parentNode.removeChild(div);
    }
  };
  render(
    <ConfigProvider theme={theme} locale={zhCN}>
      <Modal open centered footer={null} onCancel={destroy} closeIcon={null}>
        <Setting {...props} />
      </Modal>
    </ConfigProvider>,
    div,
  );
}
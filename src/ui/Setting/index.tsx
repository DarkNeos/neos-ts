import {
  AudioFilled,
  PlayCircleOutlined,
  TranslationOutlined,
} from "@ant-design/icons";
import { Modal, Tabs, TabsProps } from "antd";
import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { useTranslation } from "react-i18next";

import { I18NSelector } from "../I18N";
import { NeosConfigProvider } from "../NeosConfigProvider";
import { AnimationSetting } from "./Animation";
import { AudioSetting } from "./Audio";
import { DuelSetting } from "./Duel";

/** 设置面板属性 */
export interface SettingProps {
  /** 默认设置页 */
  defaultKey?: "audio" | "other" | "language" | "animation" | "duel";
}

export const Setting = (props: SettingProps) => {
  const { defaultKey = "audio" } = props;
  const { t: i18n } = useTranslation("SystemSettings");

  const items: TabsProps["items"] = [
    { key: "duel", label: "对战设置", children: <DuelSetting /> },
    {
      key: "audio",
      label: (
        <>
          {i18n("AudioSettings")} <AudioFilled />
        </>
      ),
      children: <AudioSetting />,
    },
    {
      key: "language",
      label: (
        <>
          {i18n("LanguageSettings")} <TranslationOutlined />
        </>
      ),
      children: <I18NSelector />,
    },
    {
      key: "animation",
      label: (
        <>
          {i18n("AnimationSettings")} <PlayCircleOutlined />
        </>
      ),
      children: <AnimationSetting />,
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
    <NeosConfigProvider>
      <Modal open centered footer={null} onCancel={destroy} closeIcon={null}>
        <Setting {...props} />
      </Modal>
    </NeosConfigProvider>,
    div,
  );
}

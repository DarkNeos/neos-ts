import { Checkbox, Form, Slider, Space, Switch } from "antd";
import React from "react";
import { useSnapshot } from "valtio";

import { settingStore } from "@/stores/settingStore";
import { useTranslation } from "react-i18next";

export const AudioSetting: React.FC = () => {
  const { audio } = useSnapshot(settingStore);
  const { t: i18n } = useTranslation("SystemSettings");
  return (
    <Form
      initialValues={audio}
      onValuesChange={(config) => {
        settingStore.saveAudioConfig(config);
      }}
      labelAlign="left"
    >
      <Form.Item label={i18n("TurnOnMusic")}>
        <Space size={16}>
          <Form.Item name="enableMusic" noStyle valuePropName="checked">
            <Checkbox />
          </Form.Item>
          <Form.Item name="musicVolume" noStyle>
            <Slider
              style={{ width: 200 }}
              min={0}
              max={1}
              step={0.01}
              tooltip={{
                formatter: (value) => ((value || 0) * 100).toFixed(0),
              }}
            />
          </Form.Item>
        </Space>
      </Form.Item>
      <Form.Item label={i18n("TurnOnSoundEffects")}>
        <Space size={16}>
          <Form.Item name="enableSoundEffects" noStyle valuePropName="checked">
            <Checkbox />
          </Form.Item>
          <Form.Item name="soundEffectsVolume" noStyle>
            <Slider
              style={{ width: 200 }}
              min={0}
              max={1}
              step={0.01}
              tooltip={{
                formatter: (value) => ((value || 0) * 100).toFixed(0),
              }}
            />
          </Form.Item>
        </Space>
      </Form.Item>
      <Form.Item
        name="enableMusicSwitchByEnv"
        label={i18n("SwitchMusicAccordingToTheEnvironment")}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </Form>
  );
};

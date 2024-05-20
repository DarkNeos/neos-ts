import { Checkbox, Form, Slider, Space, Switch } from "antd";
import React from "react";
import { useSnapshot } from "valtio";

import { settingStore } from "@/stores/settingStore";

export const AudioSetting: React.FC = () => {
  const { audio } = useSnapshot(settingStore);

  return (
    <Form
      initialValues={audio}
      onValuesChange={(config) => {
        settingStore.saveAudioConfig(config);
      }}
      labelAlign="left"
    >
      <Form.Item label="开启音乐">
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
      <Form.Item label="开启音效">
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
        label="根据环境切换音乐"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </Form>
  );
};

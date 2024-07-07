import { Form, Slider } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";

import { settingStore } from "@/stores/settingStore";

export const AnimationSetting: React.FC = () => {
  const { animation } = useSnapshot(settingStore);
  const { t: i18n } = useTranslation("SystemSettings");

  return (
    <Form
      initialValues={animation}
      onValuesChange={(config) => settingStore.saveAnimationConfig(config)}
      labelAlign="left"
    >
      <Form.Item label={i18n("AnimationSpeed")}>
        <Form.Item name="speed" noStyle>
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
      </Form.Item>
    </Form>
  );
};

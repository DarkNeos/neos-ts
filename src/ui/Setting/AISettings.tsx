import { App, Button, Col, Input, Row } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { useConfig } from "@/config";
import { settingStore } from "@/stores/settingStore";

const { agentServer } = useConfig();

export const AISettings: React.FC = () => {
  const { message } = App.useApp();
  const [server, setServer] = useState<string>(
    settingStore.ai.server ?? agentServer,
  );

  const onApply = () => {
    settingStore.saveAIConfig({ server });
    message.info("设置成功");
  };

  const onRestore = () => {
    settingStore.saveAIConfig({ server: agentServer });
    setServer(agentServer);
  };
  const { t: i18n } = useTranslation("SystemSettings");
  return (
    <div>
      <Row style={{ marginBottom: "20px" }}>
        <Col span={24}>
          <p>{i18n("CustomAIServer")}</p>
        </Col>
      </Row>
      <Row style={{ marginBottom: "20px" }}>
        <Col span={24}>
          <Input
            placeholder="Text your URL"
            value={server}
            onChange={(e) => setServer(e.target.value)}
          />
        </Col>
      </Row>
      <Row justify="end">
        <Col>
          <Button
            type="primary"
            style={{ marginRight: "8px" }}
            onClick={onApply}
          >
            {i18n("ApplyAISettings")}
          </Button>
          <Button onClick={onRestore}>{i18n("RecoverDefault")}</Button>
        </Col>
      </Row>
    </div>
  );
};

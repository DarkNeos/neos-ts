import { SendOutlined } from "@ant-design/icons";
import { Button, Col, Input, Row } from "antd";
import React, { useState } from "react";

import { sendChat } from "@/api/ocgcore/ocgHelper";

export const SendBox = () => {
  const [content, setContent] = useState("");
  return (
    <>
      <Row>
        <Input.TextArea
          placeholder="Message to sent..."
          autoSize={{ minRows: 3, maxRows: 4 }}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
          }}
        />
      </Row>
      <Row>
        <Col>
          <Button
            icon={<SendOutlined />}
            onClick={() => {
              sendChat(content);
              setContent("");
            }}
            disabled={!content}
          />
        </Col>
      </Row>
    </>
  );
};

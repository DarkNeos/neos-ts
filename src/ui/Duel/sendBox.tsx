import React, { useState } from "react";
import { Input, Button, Row, Col } from "antd";
import { SendOutlined } from "@ant-design/icons";

const SendBox = () => {
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
            onClick={() => {}}
            disabled={!content}
          />
        </Col>
      </Row>
    </>
  );
};

export default SendBox;

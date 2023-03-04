import React, { useState } from "react";
import { Input, Button, Row } from "antd";
import { SendOutlined } from "@ant-design/icons";

const SendBox = () => {
  const [content, setContent] = useState("");
  return (
    <>
      <Row>
        <Input.TextArea
          placeholder="Message to sent..."
          autoSize
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
          }}
        />
      </Row>
      <Row>
        <Button
          icon={<SendOutlined />}
          onClick={() => {}}
          disabled={!content}
        />
      </Row>
    </>
  );
};

export default SendBox;

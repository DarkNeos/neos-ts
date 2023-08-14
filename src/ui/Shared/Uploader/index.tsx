import { InboxOutlined } from "@ant-design/icons";
import { Upload, UploadProps } from "antd";
import React from "react";

export const Uploader: React.FC<
  UploadProps & { text?: string; hint?: string }
> = ({ text, hint, ...uploadProps }) => (
  <div>
    <Upload.Dragger
      {...uploadProps}
      style={{ width: "100%", margin: "20px 0 10px" }}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">{text}</p>
      <p className="ant-upload-hint">{hint}</p>
    </Upload.Dragger>
  </div>
);

import { Button, Modal, type ModalProps } from "antd";
import { type FC, useRef, useState, type CSSProperties } from "react";
import { MinusOutlined } from "@ant-design/icons";
import classNames from "classnames";
import "./index.scss";

interface Props extends ModalProps {
  canBeMinimized?: boolean;
}

export const NewModal: FC<Props> = (props) => {
  const { canBeMinimized = true } = props;
  const [mini, setMini] = useState(false);
  return (
    <Modal
      className={classNames("neos-modal", { "neos-modal-mini": mini })}
      centered
      onCancel={() => setMini(!mini)}
      closeIcon={<MinusOutlined />}
      bodyStyle={{ padding: "10px 0" }}
      {...props}
    />
  );
};

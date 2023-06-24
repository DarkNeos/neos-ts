import "./index.scss";

import { MinusOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Modal, type ModalProps } from "antd";
import classNames from "classnames";
import { type CSSProperties, type FC, useRef, useState } from "react";

interface Props extends ModalProps {
  canBeMinimized?: boolean;
}

export const NeosModal: FC<Props> = (props) => {
  const { canBeMinimized = true } = props;
  const [mini, setMini] = useState(false);
  return (
    <Modal
      className={classNames("neos-modal", { "neos-modal-mini": mini })}
      centered
      maskClosable={false}
      onCancel={() => setMini(!mini)}
      closeIcon={mini ? <UpOutlined /> : <MinusOutlined />}
      bodyStyle={{ padding: "10px 0" }}
      mask={!mini}
      closable={canBeMinimized}
      {...props}
    />
  );
};

import "./index.scss";

import { MinusOutlined, UpOutlined } from "@ant-design/icons";
import { Modal, type ModalProps } from "antd";
import classNames from "classnames";
import { useState } from "react";

interface Props extends ModalProps {
  canBeMinimized?: boolean;
}

export const NeosModal: React.FC<Props> = (props) => {
  const { canBeMinimized = true } = props;
  const [mini, setMini] = useState(false);
  return (
    <Modal
      className={classNames("neos-modal", { "neos-modal-mini": mini })}
      centered
      maskClosable={true}
      onCancel={() => setMini(!mini)}
      closeIcon={mini ? <UpOutlined /> : <MinusOutlined />}
      bodyStyle={{ padding: "10px 0" }}
      mask={!mini}
      wrapClassName={classNames({ "neos-modal-wrap": mini })}
      closable={canBeMinimized}
      {...props}
    />
  );
};

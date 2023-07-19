import styles from "./index.module.scss";

import { MinusOutlined, UpOutlined } from "@ant-design/icons";
import { Modal, type ModalProps } from "antd";
import classNames from "classnames";
import { useEffect, useState } from "react";

interface Props extends ModalProps {
  canBeMinimized?: boolean;
}

export const NeosModal: React.FC<Props> = (props) => {
  const { canBeMinimized = true } = props;
  const [mini, setMini] = useState(false);

  // 为了修antd的bug，先让isOpen发生变化，再让它变回来
  const [realOpen, setRealOpen] = useState(true);
  useEffect(() => setRealOpen(false), []);
  useEffect(() => setRealOpen(!!props.open), [props.open]);

  return (
    <Modal
      className={classNames(styles.modal, { [styles["mini"]]: mini })}
      centered
      maskClosable={true}
      onCancel={() => setMini(!mini)}
      closeIcon={mini ? <UpOutlined /> : <MinusOutlined />}
      bodyStyle={{ padding: "10px 0" }}
      mask={!mini}
      wrapClassName={classNames({ [styles.wrap]: mini })}
      closable={canBeMinimized}
      {...props}
      open={realOpen}
    />
  );
};

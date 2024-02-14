import { MinusOutlined, UpOutlined } from "@ant-design/icons";
import { Modal, type ModalProps } from "antd";
import classNames from "classnames";
import { useEffect, useState } from "react";

import styles from "./index.module.scss";

export const NeosModal: React.FC<ModalProps> = (props) => {
  const [mini, setMini] = useState(false);

  // 为了修antd的bug，先让isOpen发生变化，同时设置visibility为`hidden`，再让它变回来
  const [realOpen, setRealOpen] = useState(true);
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    setRealOpen(false);
    setHidden(false);
  }, []);
  useEffect(() => setRealOpen(!!props.open), [props.open]);

  return (
    <Modal
      className={classNames(styles.modal, {
        [styles["mini"]]: mini,
        [styles["hidden"]]: hidden,
      })}
      centered
      maskClosable={true}
      onCancel={() => setMini(!mini)}
      closeIcon={mini ? <UpOutlined /> : <MinusOutlined />}
      bodyStyle={{ padding: "10px 0" }}
      mask={!mini}
      wrapClassName={classNames({ [styles.wrap]: mini })}
      closable={true}
      {...props}
      open={realOpen}
    />
  );
};

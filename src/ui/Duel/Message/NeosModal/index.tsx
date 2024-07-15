import { MinusOutlined, UpOutlined } from "@ant-design/icons";
import { Modal, type ModalProps } from "antd";
import classNames from "classnames";
import { useEffect, useState } from "react";

import { sleep } from "@/infra";

import styles from "./index.module.scss";

export const NeosModal: React.FC<ModalProps> = (props) => {
  const [mini, setMini] = useState(false);

  // 为了修antd的bug，先让isOpen发生变化，同时设置visibility为`hidden`，再让它变回来
  const [realOpen, setRealOpen] = useState(true);
  const [hidden, setHidden] = useState(true);

  const close = async () => {
    setRealOpen(false);
    await sleep(1000);
    setHidden(false);
  };

  useEffect(() => {
    close();
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
      style={{ padding: "10px 0" }}
      mask={!mini}
      wrapClassName={classNames({ [styles.wrap]: mini })}
      closable={true}
      {...props}
      open={realOpen}
    />
  );
};

import { DownOutlined } from "@ant-design/icons";
import { Button, Drawer, Input } from "antd";
import React from "react";
import { proxy, useSnapshot } from "valtio";

import { IconFont, ScrollableArea, useChat } from "@/ui/Shared";

import styles from "./index.module.scss";

const store = proxy({ open: false });

interface ChatItem {
  name: string;
  content: string;
}

export const ChatBox: React.FC = () => {
  const { open } = useSnapshot(store);
  const { dialogs, input, setInput, ref, onSend } = useChat(true);

  const onClose = () => (store.open = false);

  return (
    <Drawer
      open={open}
      placement="bottom"
      mask={false}
      className={styles.chatbox}
      onClose={onClose}
      maskClosable
      closeIcon={<DownOutlined />}
    >
      <div className={styles.container}>
        <ScrollableArea className={styles.dialogs} ref={ref}>
          {dialogs.map((item, idx) => (
            <DialogItem key={idx} {...item} />
          ))}
        </ScrollableArea>
        <div className={styles.input}>
          <Input.TextArea
            bordered={false}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            autoSize
            placeholder="请输入聊天内容"
            onPressEnter={(e) => {
              e.preventDefault();
              onSend();
            }}
          />
          <Button
            type="text"
            icon={<IconFont type="icon-send" size={14} />}
            onClick={onSend}
          />
        </div>
      </div>
    </Drawer>
  );
};

const DialogItem: React.FC<ChatItem> = ({ name, content }) => (
  <div className={styles.item}>
    <div className={styles.name}>{name}</div>
    <span>{` > `}</span>
    <div className={styles.content}>{content}</div>
  </div>
);

export const openChatBox = () => (store.open = !store.open);

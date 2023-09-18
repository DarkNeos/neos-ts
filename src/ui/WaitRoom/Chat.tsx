import { Button, Input } from "antd";

import { IconFont, ScrollableArea, useChat } from "@/ui/Shared";

import styles from "./Chat.module.scss";

interface ChatItem {
  name: string;
  time: string;
  content: string;
}

export const Chat: React.FC = () => {
  const { dialogs, input, setInput, ref, onSend } = useChat();

  return (
    <div className={styles.chat}>
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
          icon={<IconFont type="icon-send" size={16} />}
          onClick={onSend}
        />
      </div>
    </div>
  );
};

const DialogItem: React.FC<ChatItem> = ({ name, time, content }) => {
  return (
    <div className={styles.item}>
      <div className={styles.name}>
        {name}
        <span className={styles.time}>{time}</span>
      </div>
      <div className={styles.content}>{content}</div>
    </div>
  );
};

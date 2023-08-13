import { Button, Input } from "antd";
import { type OverlayScrollbarsComponentRef } from "overlayscrollbars-react";
import { useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";

import { sendChat } from "@/api";
import { chatStore, roomStore } from "@/stores";
import { IconFont, ScrollableArea } from "@/ui/Shared";

import styles from "./Chat.module.scss";

interface ChatItem {
  name: string;
  time: string;
  content: string;
}

export const Chat: React.FC = () => {
  const [chatlist, setChatlist] = useState<ChatItem[]>([]);
  const [input, setInput] = useState<string | undefined>(undefined);
  const chat = useSnapshot(chatStore);

  useEffect(() => {
    if (chatStore.sender >= 0 && chatStore.message.length !== 0) {
      const { sender } = chatStore;
      const name =
        sender < roomStore.players.length
          ? roomStore.players[sender]?.name ?? "?"
          : (sender > 8 && sender < 11) || sender > 19
          ? "?"
          : "System";
      setChatlist((prev) => [
        ...prev,
        {
          name: name,
          time: formatTimeToHHMMSS(),
          content: chatStore.message,
        },
      ]);
      scrollToBottom();
    }
  }, [chat]);

  /** dialogs 滚动到最底下 */
  const scrollToBottom = () => {
    const viewport = ref.current?.osInstance()?.elements().viewport;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  };

  /** 发信息 */
  const send = () => {
    if (input !== undefined) {
      sendChat(input);
      setInput("");
    }
  };

  /** 滚动条的ref */
  const ref = useRef<OverlayScrollbarsComponentRef<"div">>(null);

  return (
    <div className={styles.chat}>
      <ScrollableArea className={styles.dialogs} ref={ref}>
        {chatlist.map((item, idx) => (
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
            send();
          }}
        />
        <Button
          type="text"
          icon={<IconFont type="icon-send" size={16} />}
          onClick={send}
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

function formatTimeToHHMMSS() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

// 聊天框的通用Hook

import { OverlayScrollbarsComponentRef } from "overlayscrollbars-react";
import { useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";

import { sendChat } from "@/api";
import { chatStore, roomStore } from "@/stores";

interface ChatItem {
  name: string;
  time: string;
  content: string;
}

export const useChat = () => {
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [input, setInput] = useState<string | undefined>(undefined);
  const chat = useSnapshot(chatStore);
  /** 滚动条的ref */
  const ref = useRef<OverlayScrollbarsComponentRef<"div">>(null);

  /** dialogs 滚动到最底下 */
  const scrollToBottom = () => {
    const viewport = ref.current?.osInstance()?.elements().viewport;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  };

  /** 发信息 */
  const onSend = () => {
    if (input !== undefined) {
      sendChat(input);
      setInput("");
    }
  };

  useEffect(() => {
    if (chatStore.sender >= 0 && chatStore.message.length !== 0) {
      const { sender } = chatStore;
      const name =
        sender < roomStore.players.length
          ? roomStore.players[sender]?.name ?? "?"
          : (sender > 8 && sender < 11) || sender > 19
          ? "?"
          : "System";
      setChatList((prev) => [
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

  return {
    dialogs: chatList,
    input,
    setInput,
    ref,
    onSend,
  };
};

function formatTimeToHHMMSS() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

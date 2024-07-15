// 聊天框的通用Hook

import { OverlayScrollbarsComponentRef } from "overlayscrollbars-react";
import { useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";

import { sendChat } from "@/api";
import { getUIContainer } from "@/container/compat";
import { chatStore, isMe, roomStore } from "@/stores";

interface ChatItem {
  name: string;
  time: string;
  content: string;
}

export const useChat = (isDuel: boolean = false) => {
  const container = getUIContainer();
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
      sendChat(container.conn, input);
      setInput("");
    }
  };

  // 获取消息发送者的名字
  const getSenderName = (sender: number) => {
    if (sender < roomStore.players.length) {
      if (isDuel) {
        // 决斗内和决斗外场景sender是不一样的
        if (isMe(sender)) {
          return roomStore.getMePlayer()?.name;
        } else {
          return roomStore.getOpPlayer()?.name;
        }
      } else {
        return roomStore.players[sender]?.name;
      }
    } else if (sender <= 8 || (sender >= 11 && sender <= 19)) {
      return "System";
    }
  };

  useEffect(() => {
    if (chatStore.sender >= 0 && chatStore.message.length !== 0) {
      const { sender } = chatStore;
      const name = getSenderName(sender) ?? "?";
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

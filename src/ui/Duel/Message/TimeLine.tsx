import { MessageOutlined } from "@ant-design/icons";
import { Timeline, TimelineItemProps } from "antd";
import React, { useEffect, useState } from "react";
import { useSnapshot } from "valtio";

import { chatStore } from "@/stores";

export const DuelTimeLine = () => {
  const [items, setItems] = useState<TimelineItemProps[]>([]);

  const stateChat = chatStore;
  const snapChat = useSnapshot(stateChat);

  const chat = snapChat.message;

  useEffect(() => {
    setItems((prev) =>
      prev.concat([
        {
          dot: <MessageOutlined />,
          children: chat,
          color: "green",
        },
      ])
    );
  }, [chat]);

  return <Timeline items={items} />;
};

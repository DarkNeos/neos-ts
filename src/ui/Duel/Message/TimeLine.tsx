import { MessageOutlined } from "@ant-design/icons";
import { Timeline, TimelineItemProps } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { useSnapshot } from "valtio";

import { useAppSelector } from "@/hook";
import { selectChat } from "@/reducers/chatSlice";
import { chatStore } from "@/valtioStores";

export const DuelTimeLine = () => {
  const [items, setItems] = useState<TimelineItemProps[]>([]);
  const chat = useAppSelector(selectChat);

  const stateChat = chatStore;
  const snapChat = useSnapshot(stateChat);

  // const chat = snapChat.message;

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

import { MessageOutlined } from "@ant-design/icons";
import { Timeline, TimelineItemProps } from "antd";
import React, { useEffect, useState, useContext } from "react";

import { useAppSelector } from "@/hook";
import { selectChat } from "@/reducers/chatSlice";
import { valtioContext } from "@/valtioStores";
import { useSnapshot } from "valtio";

export const DuelTimeLine = () => {
  const [items, setItems] = useState<TimelineItemProps[]>([]);
  const chat = useAppSelector(selectChat);

  const stateChat = useContext(valtioContext).chatStore;
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

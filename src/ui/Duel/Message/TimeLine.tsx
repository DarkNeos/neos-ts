import { MessageOutlined } from "@ant-design/icons";
import { Timeline, TimelineItemProps } from "antd";
import React, { useEffect, useState } from "react";

import { useAppSelector } from "@/hook";
import { selectChat } from "@/reducers/chatSlice";

export const DuelTimeLine = () => {
  const [items, setItems] = useState<TimelineItemProps[]>([]);
  const chat = useAppSelector(selectChat);

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

import React, { useEffect, useState } from "react";
import { Timeline, TimelineItemProps } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { useAppSelector } from "../../hook";
import { selectChat } from "../../reducers/chatSlice";

const DuelTimeLine = () => {
  const [items, setItems] = useState<TimelineItemProps[]>([]);
  const chat = useAppSelector(selectChat);

  useEffect(() => {
    setItems((prev) =>
      prev.concat([
        {
          dot: <SettingOutlined />,
          children: chat,
          color: "red",
        },
      ])
    );
  }, [chat]);

  return <Timeline items={items} />;
};

export default DuelTimeLine;

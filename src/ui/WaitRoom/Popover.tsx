import { Button, Popover, Space } from "antd";
import { useEffect, useState } from "react";

import { eventbus, Task } from "@/infra";

import { IconFont } from "../Shared";
import { useTranslation } from "react-i18next";

export enum Mora {
  Scissors = "scissors",
  Rock = "rock",
  Paper = "paper",
}

export enum Tp {
  First = 1,
  Second = 2,
}

export const MoraPopover: React.FC<
  React.PropsWithChildren<{ onSelect?: (result: Mora) => void }>
> = ({ children, onSelect }) => {
  const [open, setOpen] = useState(false);

  // 需要在mora的service之中，emit一个事件，让这个组件监听到，然后打开popover
  useEffect(() => {
    // 这里不能用`once`，因为如果双方猜拳结果一样的话会重新猜拳
    eventbus.on(Task.Mora, () => {
      setOpen(true);
    });
  }, []);

  const onClick = (result: Mora) => {
    result; // 这里send猜拳的结果给服务器
    onSelect?.(result);
    setOpen(false);
  };

  const { t: i18n } = useTranslation("WaitRoom");

  const map = {
    [Mora.Rock]: i18n("Rock"),
    [Mora.Scissors]: i18n("Scissors"), 
    [Mora.Paper]: i18n("Paper")
  };

  return (
    <Popover
      overlayStyle={{ backdropFilter: "blur(10px)" }}
      content={
        <Space>
          {[Mora.Rock, Mora.Scissors, Mora.Paper].map((mora) => (
            <Button
              key={mora}
              size="large"
              type="text"
              icon={<IconFont type={`icon-hand-${mora}`} size={16} />}
              onClick={() => onClick(mora)}
            >
              {map[mora]}
            </Button>
          ))}
        </Space>
      }
      open={open}
      placement="bottom"
    >
      {children}
    </Popover>
  );
};

export const TpPopover: React.FC<
  React.PropsWithChildren<{
    onSelect?: (result: Tp) => void;
  }>
> = ({ children, onSelect }) => {
  const [open, setOpen] = useState(false);

  // 需要在mora的service之中，emit一个事件，让这个组件监听到，然后打开popover
  useEffect(() => {
    eventbus.once(Task.Tp, () => {
      setOpen(true);
    });
  }, []);

  const onClick = (result: Tp) => {
    result; // 这里send结果给服务器
    onSelect?.(result);
    setOpen(false);
  };

  const map = {
    [Tp.First]: "先手",
    [Tp.Second]: "后手",
  };

  return (
    <Popover
      overlayStyle={{ backdropFilter: "blur(0.625rem)" }}
      content={
        <Space>
          {[Tp.First, Tp.Second].map((item) => (
            <Button
              key={item}
              size="large"
              type="text"
              icon={
                <IconFont
                  type={`icon-${item === Tp.First ? "one" : "two"}`}
                  size={16}
                />
              }
              onClick={() => onClick(item)}
            >
              {map[item]}
            </Button>
          ))}
        </Space>
      }
      open={open}
      placement="bottom"
    >
      {children}
    </Popover>
  );
};

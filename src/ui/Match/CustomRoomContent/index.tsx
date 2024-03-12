import { CopyOutlined, KeyOutlined } from "@ant-design/icons";
import type { CheckboxProps } from "antd";
import { App, Button, Checkbox, Input } from "antd";
import React, { ChangeEvent, useEffect } from "react";
import { proxy, useSnapshot } from "valtio";

import { defaultOptions, getPrivateRoomID, Options } from "@/api";
import { accountStore } from "@/stores";
import { Select } from "@/ui/Shared";

import styles from "./index.module.scss";

interface CustomRoomProps {
  options: Options;
  isPrivate: boolean;
  friendPrivateID?: number;
}

const defaultProps: CustomRoomProps = {
  options: defaultOptions,
  isPrivate: true, // 暂时只支持私密模式
};

export const mcCustomRoomStore = proxy<CustomRoomProps>(defaultProps);

// TODO: support public room
export const CustomRoomContent: React.FC = () => {
  const { message } = App.useApp();
  const user = useSnapshot(accountStore).user;
  const { options, friendPrivateID } = useSnapshot(mcCustomRoomStore);
  const privateRoomID = getPrivateRoomID(user?.external_id ?? 0);

  useEffect(() => {
    if (!user) {
      message.error("请先登录萌卡账号!");
    }
  }, [user]);

  const onCopy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard
        .writeText(String(privateRoomID))
        .then(() => {
          message.info("房间密码复制成功！");
        })
        .catch((err) => {
          message.error("复制到剪贴板失败:", err);
        });
    } else {
      message.error("浏览器不支持 Clipboard API");
    }
  };
  const onChangeStartLP = (event: ChangeEvent<HTMLInputElement>) => {
    mcCustomRoomStore.options.start_lp = Number(event.target.value);
  };
  const onChangeStartHand = (event: ChangeEvent<HTMLInputElement>) => {
    mcCustomRoomStore.options.start_hand = Number(event.target.value);
  };
  const onChangeDrawCount = (event: ChangeEvent<HTMLInputElement>) => {
    mcCustomRoomStore.options.draw_count = Number(event.target.value);
  };
  const onChangeRule = (value: any) => {
    mcCustomRoomStore.options.rule = value;
  };
  const onChangeMode = (value: any) => {
    mcCustomRoomStore.options.mode = value;
  };
  const onChangeDuelRule = (value: any) => {
    mcCustomRoomStore.options.duel_rule = value;
  };
  const onChangeNoCheckDeck: CheckboxProps["onChange"] = (e) => {
    mcCustomRoomStore.options.no_check_deck = e.target.checked;
  };
  const onChangeNoShuffleDeck: CheckboxProps["onChange"] = (e) => {
    mcCustomRoomStore.options.no_shuffle_deck = e.target.checked;
  };
  const onChangeAutoDeath: CheckboxProps["onChange"] = (e) => {
    mcCustomRoomStore.options.auto_death = e.target.checked;
  };
  const onChangePrivateID = (event: ChangeEvent<HTMLInputElement>) => {
    mcCustomRoomStore.friendPrivateID = Number(event.target.value);
  };

  return (
    <div className={styles.container}>
      <p>创建/加入私密房间</p>
      <div className={styles.clipboard}>
        <div className={styles.title}>
          房间密码
          <KeyOutlined />
        </div>
        <Input
          className={styles.input}
          value={privateRoomID}
          type="number"
          readOnly
        />
        <Button icon={<CopyOutlined />} onClick={onCopy} />
      </div>
      <div className={styles["digit-option"]}>
        <div className={styles.title}>初始LP</div>
        <Input
          className={styles.input}
          value={options.start_lp}
          onChange={onChangeStartLP}
          type="number"
        />
      </div>
      <div className={styles["digit-option"]}>
        <div className={styles.title}>初始手牌数</div>
        <Input
          className={styles.input}
          value={options.start_hand}
          onChange={onChangeStartHand}
          type="number"
        />
      </div>
      <div className={styles["digit-option"]}>
        <div className={styles.title}>每回合抽卡</div>
        <Input
          className={styles.input}
          value={options.draw_count}
          onChange={onChangeDrawCount}
          type="number"
        />
      </div>
      <div className={styles["select-option"]}>
        <Select
          title="卡片允许"
          value={options.rule}
          options={[
            { value: 0, label: "OCG" },
            { value: 1, label: "TCG" },
            { value: 2, label: "简体中文" },
            { value: 3, label: "自制卡" },
            { value: 4, label: "专有卡禁止" },
            { value: 5, label: "所有卡片" },
          ]}
          onChange={onChangeRule}
        />
      </div>
      <div className={styles["select-option"]}>
        <Select
          title="决斗模式"
          value={options.mode}
          options={[
            { value: 0, label: "单局模式" },
            { value: 1, label: "比赛模式" },
            // {value: 2, label: "TAG"},
          ]}
          onChange={onChangeMode}
        />
      </div>
      <div className={styles["select-option"]}>
        <Select
          title="决斗规则"
          value={options.duel_rule}
          options={[
            { value: 1, label: "大师规则1" },
            { value: 2, label: "大师规则2" },
            { value: 3, label: "大师规则3" },
            { value: 4, label: "新大师规则" },
            { value: 5, label: "大师规则2020" },
          ]}
          onChange={onChangeDuelRule}
        />
      </div>
      <Checkbox
        className={styles.check}
        checked={options.no_check_deck}
        onChange={onChangeNoCheckDeck}
      >
        不检查卡组
      </Checkbox>
      <Checkbox
        className={styles.check}
        checked={options.no_shuffle_deck}
        onChange={onChangeNoShuffleDeck}
      >
        不切洗卡组
      </Checkbox>
      <Checkbox
        className={styles.check}
        checked={options.auto_death}
        onChange={onChangeAutoDeath}
      >
        40分自动加时
      </Checkbox>
      <Input
        value={friendPrivateID}
        onChange={onChangePrivateID}
        placeholder="在这输入你朋友的私密房间密码"
        type="text"
      />
    </div>
  );
};

export const CustomRoomFooter: React.FC<{
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}> = ({ onCreateRoom, onJoinRoom }) => {
  return (
    <div className={styles.footer}>
      <Button className={styles.btn} onClick={onCreateRoom}>
        创建私密房间
      </Button>
      <Button className={styles.btn} onClick={onJoinRoom}>
        加入私密房间
      </Button>
    </div>
  );
};

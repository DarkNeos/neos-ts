import { CopyOutlined, KeyOutlined } from "@ant-design/icons";
import type { CheckboxProps } from "antd";
import { App, Button, Checkbox, Input } from "antd";
import React, { ChangeEvent, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t: i18n } = useTranslation("CustomRoomContent");
  return (
    <div className={styles.container}>
      <p>{i18n("CreateJoinPrivateRoom")}</p>
      <div className={styles.clipboard}>
        <div className={styles.title}>
          {i18n("RoomPassword")}
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
        <div className={styles.title}>{i18n("Initial")}LP</div>
        <Input
          className={styles.input}
          value={options.start_lp}
          onChange={onChangeStartLP}
          type="number"
        />
      </div>
      <div className={styles["digit-option"]}>
        <div className={styles.title}>{i18n("InitialHandSize")}</div>
        <Input
          className={styles.input}
          value={options.start_hand}
          onChange={onChangeStartHand}
          type="number"
        />
      </div>
      <div className={styles["digit-option"]}>
        <div className={styles.title}>{i18n("DrawPerTurn")}</div>
        <Input
          className={styles.input}
          value={options.draw_count}
          onChange={onChangeDrawCount}
          type="number"
        />
      </div>
      <div className={styles["select-option"]}>
        <Select
          title={i18n("CardsAllowed")}
          value={options.rule}
          options={[
            { value: 0, label: "OCG" },
            { value: 1, label: "TCG" },
            { value: 2, label: i18n("SimplifiedChinese") },
            { value: 3, label: i18n("CustomCards") },
            { value: 4, label: i18n("ExclusiveCardsProhibited") },
            { value: 5, label: i18n("AllCards") },
          ]}
          onChange={onChangeRule}
        />
      </div>
      <div className={styles["select-option"]}>
        <Select
          title={i18n("DuelMode")}
          value={options.mode}
          options={[
            { value: 0, label: i18n("SingleMatchMode") },
            { value: 1, label: i18n("TournamentMode") },
            // {value: 2, label: "TAG"},
          ]}
          onChange={onChangeMode}
        />
      </div>
      <div className={styles["select-option"]}>
        <Select
          title={i18n("DuelRules")}
          value={options.duel_rule}
          options={[
            { value: 1, label: i18n("MasterRule1") },
            { value: 2, label: i18n("MasterRule2") },
            { value: 3, label: i18n("MasterRule3") },
            { value: 4, label: i18n("NewMasterRule") },
            { value: 5, label: i18n("MasterRule2020") },
          ]}
          onChange={onChangeDuelRule}
        />
      </div>
      <Checkbox
        className={styles.check}
        checked={options.no_check_deck}
        onChange={onChangeNoCheckDeck}
      >
        {i18n("NoDeckCheck")}
      </Checkbox>
      <Checkbox
        className={styles.check}
        checked={options.no_shuffle_deck}
        onChange={onChangeNoShuffleDeck}
      >
        {i18n("NoShuffleDeck")}
      </Checkbox>
      <Checkbox
        className={styles.check}
        checked={options.auto_death}
        onChange={onChangeAutoDeath}
      >
        {i18n("40MinutesAutomaticOvertime")}
      </Checkbox>
      <Input
        value={friendPrivateID}
        onChange={onChangePrivateID}
        placeholder={i18n("EnterYourFriendsPrivateRoomPassword")}
        type="text"
      />
    </div>
  );
};

export const CustomRoomFooter: React.FC<{
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}> = ({ onCreateRoom, onJoinRoom }) => {
  const { t: i18n } = useTranslation("CustomRoomContent");
  return (
    <div className={styles.footer}>
      <Button className={styles.btn} onClick={onCreateRoom}>
        {i18n("CreatePrivateRoom")}
      </Button>
      <Button className={styles.btn} onClick={onJoinRoom}>
        {i18n("JoinPrivateRoom")}
      </Button>
    </div>
  );
};

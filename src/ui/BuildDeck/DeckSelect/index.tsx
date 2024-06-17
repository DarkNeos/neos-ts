import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileAddOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { App, Button, Dropdown, MenuProps, UploadProps } from "antd";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import YGOProDeck from "ygopro-deck-encode";

import { uploadDeck } from "@/api";
import { accountStore, deckStore, IDeck } from "@/stores";

import { Uploader } from "../../Shared";
import { genYdkText } from "../utils";
import styles from "./index.module.scss";

const DEFAULT_DECK_CASE = 1082012;

export const DeckSelect: React.FC<{
  decks: IDeck[];
  selected: string;
  onSelect: (deckName: string) => any;
  onDelete: (deckName: string) => Promise<any>;
  onDownload: (deckName: string) => any;
  onCopy: (deckName: string) => Promise<any>;
}> = ({ decks, selected, onSelect, onDelete, onDownload, onCopy }) => {
  const newDeck = useRef<IDeck[]>([]);
  const { modal, message } = App.useApp();
  const { t: i18n } = useTranslation("DeckSelect");

  /** 创建卡组，直接给一个命名，用户可以手动修改，无需modal打断流程 */
  const createNewDeck = async () => {
    const deckName = new Date().toLocaleString();
    await deckStore.add({
      deckName,
      main: [],
      extra: [],
      side: [],
    });
    onSelect(deckName);
  };

  const showUploadModal = () =>
    modal.info({
      width: 600,
      centered: true,
      icon: null,
      content: (
        <DeckUploader
          onLoaded={(deck) => {
            newDeck.current.push(deck);
          }}
        />
      ),
      okText: "上传",
      maskClosable: true,
      onOk: async () => {
        const results = await Promise.all(
          newDeck.current.map((deck) => deckStore.add(deck)),
        );
        newDeck.current = [];
        if (results.length)
          results.every(Boolean)
            ? message.success("上传成功")
            : message.error("部分文件上传失败");
      },
    });

  /** 从剪贴板导入。为什么错误处理这么丑陋... */
  const importFromClipboard = () => {
    // 检查浏览器是否支持 Clipboard API
    if (navigator.clipboard) {
      // 获取剪贴板内容
      navigator.clipboard
        .readText()
        .then((text) => {
          const deck = YGOProDeck.fromYdkString(text);
          if (
            !(deck.main.length + deck.extra.length + deck.side.length === 0)
          ) {
            // YDK解析成功
            const deckName = new Date().toLocaleString();
            deckStore
              .add({
                deckName,
                ...deck,
              })
              .then((result) => {
                if (result) {
                  message.success(`导入成功，卡组名为：${deckName}`);
                  onSelect(deckName);
                } else {
                  message.error(`解析失败，请检查格式是否正确。`);
                }
              });
          } else {
            message.error(`解析失败，请检查格式是否正确。`);
          }
        })
        .catch((err) => {
          message.error("无法读取剪贴板内容:", err);
        });
    } else {
      message.error("浏览器不支持 Clipboard API");
    }
  };

  const items: MenuProps["items"] = [
    {
      label: `${i18n("CreateNewDeck")}`,
      icon: <PlusOutlined />,
      onClick: createNewDeck,
    },
    {
      label: `${i18n("ImportFromLocalFile")}`,
      icon: <FileAddOutlined />,
      onClick: showUploadModal,
    },
    {
      label: `${i18n("ImportFromClipboard")}`,
      icon: <CopyOutlined />,
      onClick: importFromClipboard,
    },
  ].map((_, key) => ({ ..._, key }));

  const onUploadMdDeck = async (deck: IDeck) => {
    const user = accountStore.user;
    if (user) {
      // TODO: Deck Case
      const resp = await uploadDeck({
        userId: user.id,
        token: user.token,
        deckContributor: user.username,
        deck: {
          deckName: deck.deckName,
          deckCase: DEFAULT_DECK_CASE,
          deckYdk: genYdkText(deck),
        },
      });
      if (resp) {
        if (resp.code) {
          message.error(resp.message);
        } else {
          message.success(`上传在线卡组<${deck.deckName}>成功!`);
        }
      } else {
        message.error("上传在线卡组失败，请检查网络状况。");
      }
    } else {
      message.error("需要先登录萌卡账号才能上传在线卡组！");
    }
  };

  return (
    <>
      <div className={styles["deck-select"]}>
        {decks.map((deck) => (
          <div
            key={deck.deckName}
            className={styles.item}
            onClick={() => onSelect(deck.deckName)}
          >
            <div className={styles.hover} />
            {selected === deck.deckName && <div className={styles.selected} />}
            <span>{deck.deckName}</span>
            <div className={styles.btns}>
              <Button
                icon={<CopyOutlined />}
                type="text"
                size="small"
                onClick={cancelBubble(async () => {
                  const result = await onCopy(deck.deckName);
                  result
                    ? message.success(`${i18n("CopySuccessful")}`)
                    : message.error(`${i18n("CopyFailed")}`);
                })}
              />
              <Button
                icon={<DeleteOutlined />}
                type="text"
                size="small"
                onClick={cancelBubble(async () => {
                  await onDelete(deck.deckName);
                  onSelect(decks[0].deckName);
                })}
              />

              <Button
                icon={<DownloadOutlined />}
                type="text"
                size="small"
                onClick={cancelBubble(() => onDownload(deck.deckName))}
              />
              <Button
                icon={<UploadOutlined />}
                type="text"
                size="small"
                onClick={cancelBubble(async () => onUploadMdDeck(deck))}
              />
            </div>
          </div>
        ))}
      </div>
      <Dropdown menu={{ items }} placement="top" arrow trigger={["click"]}>
        <Button
          className={styles["btn-add"]}
          icon={<PlusOutlined />}
          shape="circle"
          type="text"
          size="large"
        />
      </Dropdown>
    </>
  );
};

const DeckUploader: React.FC<{ onLoaded: (deck: IDeck) => void }> = ({
  onLoaded,
}) => {
  const [uploadState, setUploadState] = useState("");
  const { message } = App.useApp();
  const { t: i18n } = useTranslation("DeckSelect");
  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    onChange(info) {
      if (uploadState !== "ERROR") {
        info.file.status = "done";
      }
    },
    accept: ".ydk",
    beforeUpload(file, _) {
      console.log({ file });
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        const ydk = e.target?.result as string;
        const deck = YGOProDeck.fromYdkString(ydk);

        if (!(deck.main.length + deck.extra.length + deck.side.length === 0)) {
          // YDK解析成功
          onLoaded({ deckName: file.name.replace(/\.ydk/g, ""), ...deck });
        } else {
          message.error(`${file.name}解析失败，请检查格式是否正确。`);
          setUploadState("ERROR");
        }
      };
    },
  };

  return (
    <Uploader
      {...uploadProps}
      text={i18n("ClickOrDragFilesHereToUpload")}
      hint={i18n("SupportsYdkExtension")}
    />
  );
};

/** 阻止事件冒泡 */
const cancelBubble =
  <T,>(fn: (e: React.SyntheticEvent) => T) =>
  (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    return fn(e);
  };

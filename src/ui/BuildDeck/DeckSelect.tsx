import {
  DeleteOutlined,
  DownloadOutlined,
  FileAddOutlined,
  InboxOutlined,
  PlusOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { App, Button, Dropdown, MenuProps, Upload, UploadProps } from "antd";
import React, { useRef, useState } from "react";
import YGOProDeck from "ygopro-deck-encode";

import { deckStore, IDeck } from "@/stores";

import styles from "./DeckSelect.module.scss";

export const DeckSelect: React.FC<{
  decks: readonly { deckName: string }[];
  selected: string;
  onSelect: (deckName: string) => any;
  onDelete: (deckName: string) => Promise<any>;
  onDownload: (deckName: string) => any;
}> = ({ decks, selected, onSelect, onDelete, onDownload }) => {
  const newDeck = useRef<IDeck[]>([]);
  const { modal, message } = App.useApp();

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
        const newDecks = await Promise.all(
          newDeck.current.map((deck) => deckStore.add(deck))
        );
        newDecks.every(Boolean)
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
      label: "新建卡组",
      icon: <PlusOutlined />,
      onClick: createNewDeck,
    },
    {
      label: "从本地文件导入",
      icon: <FileAddOutlined />,
      onClick: showUploadModal,
    },
    {
      label: "从剪贴板导入",
      icon: <CopyOutlined />,
      onClick: importFromClipboard,
    },
  ].map((_, key) => ({ ..._, key }));

  return (
    <>
      <div className={styles["deck-select"]}>
        {decks.map(({ deckName }) => (
          <div
            key={deckName}
            className={styles.item}
            onClick={() => onSelect(deckName)}
          >
            <div className={styles.hover} />
            {selected === deckName && <div className={styles.selected} />}
            <span>{deckName}</span>
            <div className={styles.btns}>
              <Button
                icon={<DeleteOutlined />}
                type="text"
                size="small"
                onClick={cancelBubble(async () => {
                  await onDelete(deckName);
                  onSelect(decks[0].deckName);
                })}
              />
              <Button
                icon={<DownloadOutlined />}
                type="text"
                size="small"
                onClick={cancelBubble(() => onDownload(deckName))}
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
  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    onChange(info) {
      if (uploadState != "ERROR") {
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
    <div>
      <Upload.Dragger
        {...uploadProps}
        style={{ width: "100%", margin: "20px 0 10px" }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">单击或拖动文件到此区域进行上传</p>
        <p className="ant-upload-hint">仅支持后缀名为ydk的卡组文件。</p>
      </Upload.Dragger>
    </div>
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

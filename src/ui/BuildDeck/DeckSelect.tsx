import {
  DeleteOutlined,
  DownloadOutlined,
  FileAddOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Dropdown,
  Input,
  MenuProps,
  Upload,
  UploadProps,
} from "antd";
import React, { useRef, useState } from "react";
import YGOProDeck from "ygopro-deck-encode";

import { deckStore, IDeck } from "@/stores";

import styles from "./DeckSelect.module.scss";

export const DeckSelect: React.FC<{
  decks: readonly { deckName: string }[];
  selected: string;
  onSelect: (deckName: string) => void;
  onDelete: (deckName: string) => void;
  onDownload: (deckName: string) => void;
  onAdd: () => void;
}> = ({ decks, selected, onSelect, onDelete, onDownload, onAdd }) => {
  const newDeck = useRef<IDeck | null>(null);
  const newDeckName = useRef<string | null>(null);
  const { modal } = App.useApp();
  const modalProps = { width: 500, centered: true, icon: null };
  const showCreateModal = () => {
    const { destroy } = modal.info({
      ...modalProps,
      title: "请输入新卡组名称",
      content: (
        <Input
          onChange={(e) => {
            newDeckName.current = e.target.value;
          }}
        />
      ),
      okText: "新建",
      onCancel: () => destroy(),
      onOk: async () => {
        if (newDeckName.current && newDeckName.current !== "") {
          await deckStore.add({
            deckName: newDeckName.current,
            main: [],
            extra: [],
            side: [],
          });
        }
      },
    });
  };
  const showUploadModal = () => {
    const { destroy } = modal.info({
      ...modalProps,
      title: "请上传YDK文件",
      content: (
        <DeckUploader
          onLoaded={(deck) => {
            newDeck.current = deck;
          }}
        />
      ),
      okText: "上传",
      onCancel: () => destroy(),
      onOk: async () => {
        if (newDeck.current) {
          await deckStore.add(newDeck.current);
        }
      },
    });
  };

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: "新建卡组",
      icon: <PlusOutlined />,
      onClick: showCreateModal,
    },
    {
      key: "2",
      label: "导入卡组",
      icon: <FileAddOutlined />,
      onClick: showUploadModal,
    },
  ];

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
                onClick={cancelBubble(() => onDelete(deckName))}
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
          onClick={onAdd}
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
  const uploadProps: UploadProps = {
    name: "file",
    onChange(info) {
      if (uploadState != "ERROR") {
        info.file.status = "done";
      }
    },
    beforeUpload(file, _) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        const ydk = e.target?.result as string;
        const deck = YGOProDeck.fromYdkString(ydk);

        if (
          !(
            deck.main.length === 0 &&
            deck.extra.length === 0 &&
            deck.side.length === 0
          )
        ) {
          // YDK解析成功
          onLoaded({ deckName: file.name.replace(/\.ydk/g, ""), ...deck });
        } else {
          alert(`${file.name}解析失败，请检查格式是否正确。`);
          setUploadState("ERROR");
        }
      };
    },
  };

  return (
    <Upload {...uploadProps}>
      <Button icon={<UploadOutlined />}>点击上传</Button>
    </Upload>
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

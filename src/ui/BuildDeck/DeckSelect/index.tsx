import {
  CloudOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  FileAddOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { App, Button, Dropdown, Input, MenuProps, UploadProps } from "antd";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import YGOProDeck from "ygopro-deck-encode";

import { uploadDeck } from "@/api";
import { accountStore, deckStore, IDeck } from "@/stores";
import { deckLibraryStore } from "@/stores/deckLibraryStore";

import { ScrollableArea, Uploader } from "../../Shared";
import { copyDeckToClipboard, downloadDeckAsYDK, genYdkText } from "../utils";
import styles from "./index.module.scss";

const DEFAULT_DECK_CASE = 1082012;

export const DeckSelect: React.FC<{
  decks: IDeck[];
  selected: string;
  selectedId?: string;
  onSelectCloud: (id: string) => void;
  onSelect: (deckName: string) => any;
  onDelete: (deckName: string) => Promise<any>;
  onDeleteCloud: (id: string) => Promise<void>;
  onDownload: (deckName: string) => any;
  onCopy: (deckName: string) => Promise<any>;
}> = ({
  decks,
  selected,
  selectedId,
  onSelectCloud,
  onSelect,
  onDelete,
  onDeleteCloud,
  onDownload,
  onCopy,
}) => {
  const newDeck = useRef<IDeck[]>([]);
  const { modal, message } = App.useApp();
  const { t: i18n } = useTranslation("DeckSelect");
  const library = useSnapshot(deckLibraryStore);

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
      if (resp.code !== 0) {
        message.error(resp.message);
      } else {
        message.success(`上传在线卡组<${deck.deckName}>成功!`);
      }
    } else {
      message.error("需要先登录萌卡账号才能上传在线卡组！");
    }
  };

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "操作失败，请重试",
      );
    }
  };
  const query = library.query.trim().toLocaleLowerCase();
  const entries = library.entries.filter((entry) =>
    entry.deckName.toLocaleLowerCase().includes(query),
  );

  return (
    <div className={styles["deck-select"]} data-testid="deck-library-sidebar">
      <div className={styles.libraryHeader}>
        <strong>我的卡组</strong>
        <div className={styles.libraryActions}>
          <Button
            type="text"
            size="small"
            aria-label="刷新云卡组"
            title="刷新云卡组"
            icon={<ReloadOutlined />}
            loading={library.loading || library.restoring}
            disabled={library.accountId === undefined}
            onClick={() => void deckLibraryStore.refresh()}
          />
          <Dropdown
            menu={{ items }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Button
              icon={<PlusOutlined />}
              type="text"
              size="small"
              aria-label="新建或导入卡组"
              title="新建或导入卡组"
              data-testid="deck-library-add"
            />
          </Dropdown>
        </div>
      </div>
      <Input
        className={styles.search}
        prefix={<SearchOutlined />}
        placeholder="搜索我的卡组"
        aria-label="搜索我的卡组"
        allowClear
        value={library.query}
        onChange={(event) => deckLibraryStore.search(event.target.value)}
      />
      <div className={styles.libraryList}>
        <ScrollableArea>
          {(["cloud", "local"] as const).map((source) => {
            const group = entries.filter((entry) => entry.source === source);
            const open = !!query || !library.collapsed.includes(source);
            return (
              <section key={source} data-testid={`deck-library-${source}`}>
                <button
                  type="button"
                  className={styles.groupTitle}
                  aria-expanded={open}
                  onClick={() => deckLibraryStore.toggleGroup(source)}
                >
                  <DownOutlined rotate={open ? 0 : -90} />
                  {source === "cloud" && <CloudOutlined />}
                  <span>{source === "cloud" ? "我的云卡组" : "本地卡组"}</span>
                  <small>{group.length}</small>
                </button>
                {open && (
                  <>
                    {source === "cloud" && library.accountId === undefined && (
                      <p className={styles.status}>
                        登录萌卡后自动加载个人云卡组
                      </p>
                    )}
                    {source === "cloud" && library.error && (
                      <p role="status" className={styles.status}>
                        {library.error}。
                        {group.length
                          ? "当前显示缓存，可继续使用。"
                          : "请点击上方刷新按钮重试。"}
                      </p>
                    )}
                    {!group.length &&
                      (source === "local" ||
                        library.accountId !== undefined) && (
                        <p className={styles.status}>
                          {library.restoring ||
                          (library.loading && source === "cloud")
                            ? "正在加载…"
                            : query
                            ? "没有匹配的卡组"
                            : source === "cloud"
                            ? "还没有个人云卡组"
                            : "还没有本地卡组"}
                        </p>
                      )}
                    {group.map((entry) => {
                      const isCloud = entry.source === "cloud";
                      const active = selectedId
                        ? selectedId === entry.id
                        : !isCloud && selected === entry.deckName;
                      const pinned = library.pinned.includes(entry.id);
                      const actions: MenuProps["items"] = isCloud
                        ? [
                            {
                              key: "copy-local",
                              label: "另存为本地",
                              icon: <DownloadOutlined />,
                              onClick: () =>
                                void run(async () => {
                                  const deck = await deckLibraryStore.resolve(
                                    entry.id,
                                  );
                                  const copy =
                                    await deckLibraryStore.saveLocalCopy(deck);
                                  onSelect(copy.deckName);
                                  message.success("已另存为本地卡组");
                                }),
                            },
                            {
                              key: "download",
                              label: "导出 YDK",
                              icon: <DownloadOutlined />,
                              onClick: () =>
                                void run(async () =>
                                  downloadDeckAsYDK(
                                    await deckLibraryStore.resolve(entry.id),
                                  ),
                                ),
                            },
                            {
                              key: "copy",
                              label: "复制到剪贴板",
                              icon: <CopyOutlined />,
                              onClick: () =>
                                void run(async () => {
                                  const ok = await copyDeckToClipboard(
                                    await deckLibraryStore.resolve(entry.id),
                                  );
                                  message[ok ? "success" : "error"](
                                    ok ? "复制成功" : "复制失败",
                                  );
                                }),
                            },
                            {
                              key: "delete-cloud",
                              label: "删除云卡组",
                              danger: true,
                              icon: <DeleteOutlined />,
                              onClick: () =>
                                modal.confirm({
                                  title: "删除云卡组",
                                  content: (
                                    <>
                                      <p>
                                        将删除云端保存的卡组：{entry.deckName}。
                                      </p>
                                      <p>
                                        删除会同步到其他设备，无法撤销。该卡组未保存的修改也会被放弃，已另存的本地副本不受影响。
                                      </p>
                                    </>
                                  ),
                                  okText: "删除云端卡组",
                                  cancelText: "取消",
                                  okButtonProps: { danger: true },
                                  onOk: async () => {
                                    try {
                                      await onDeleteCloud(entry.id);
                                      message.success("已删除云端卡组");
                                    } catch (error) {
                                      message.error(
                                        error instanceof Error
                                          ? error.message
                                          : "删除失败，请重试",
                                      );
                                      throw error;
                                    }
                                  },
                                }),
                            },
                          ]
                        : [
                            {
                              key: "copy",
                              label: "复制到剪贴板",
                              icon: <CopyOutlined />,
                              onClick: () =>
                                void run(async () => {
                                  const ok = await onCopy(entry.deckName);
                                  message[ok ? "success" : "error"](
                                    ok
                                      ? i18n("CopySuccessful")
                                      : i18n("CopyFailed"),
                                  );
                                }),
                            },
                            {
                              key: "download",
                              label: "导出 YDK",
                              icon: <DownloadOutlined />,
                              onClick: () => onDownload(entry.deckName),
                            },
                            {
                              key: "upload",
                              label: "发布为公开云卡组",
                              icon: <UploadOutlined />,
                              onClick: () =>
                                void run(async () => {
                                  const deck = decks.find(
                                    (item) => item.deckName === entry.deckName,
                                  );
                                  if (deck) {
                                    await onUploadMdDeck(deck);
                                    await deckLibraryStore.refresh();
                                  }
                                }),
                            },
                            {
                              key: "delete",
                              label: "删除本地卡组",
                              danger: true,
                              icon: <DeleteOutlined />,
                              onClick: () =>
                                void run(async () => {
                                  await onDelete(entry.deckName);
                                  if (active && deckStore.decks[0])
                                    onSelect(deckStore.decks[0].deckName);
                                }),
                            },
                          ];
                      return (
                        <div
                          key={entry.id}
                          className={styles.item}
                          data-testid="deck-library-entry"
                          data-entry-id={entry.id}
                          data-selected={active}
                          data-pinned={pinned}
                        >
                          {active && <div className={styles.selected} />}
                          <button
                            type="button"
                            className={styles.deckName}
                            title={entry.deckName}
                            aria-pressed={active}
                            onClick={() =>
                              isCloud
                                ? onSelectCloud(entry.id)
                                : onSelect(entry.deckName)
                            }
                          >
                            {library.selectingId === entry.id
                              ? "加载中…"
                              : entry.deckName}
                          </button>
                          <div className={styles.btns}>
                            <Button
                              type="text"
                              size="small"
                              aria-label={pinned ? "取消置顶" : "置顶卡组"}
                              title={pinned ? "取消置顶" : "置顶卡组"}
                              className={pinned ? styles.pinned : undefined}
                              icon={pinned ? <StarFilled /> : <StarOutlined />}
                              onClick={() =>
                                deckLibraryStore.togglePin(entry.id)
                              }
                            />
                            <Dropdown
                              menu={{ items: actions }}
                              trigger={["click"]}
                            >
                              <Button
                                type="text"
                                size="small"
                                aria-label="卡组操作"
                                icon={<MoreOutlined />}
                              />
                            </Dropdown>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </section>
            );
          })}
        </ScrollableArea>
      </div>
    </div>
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

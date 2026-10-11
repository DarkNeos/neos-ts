import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  RetweetOutlined,
  SwapOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { App, Button, Input, message, Tooltip } from "antd";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import { useEffect, useMemo, useState } from "react";
import { DndProvider } from "react-dnd-multi-backend";
import { useTranslation } from "react-i18next";
import { LoaderFunction } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";
import { subscribeKey } from "valtio/utils";

import { type CardMeta, forbidden, forbidden_408 } from "@/api";
import { isExtraDeckCard } from "@/common";
import { AudioActionType, changeScene } from "@/infra/audio";
import {
  deckStore,
  type IDeck,
  initStore,
  resetUniverse,
  trainingStore,
} from "@/stores";
import { banlistStore } from "@/stores/banlistStore";
import { deckDraftStore } from "@/stores/deckDraftStore";
import { deckLibraryStore, localDeckId } from "@/stores/deckLibraryStore";
import { disconnectSession } from "@/ui/Match/util";
import {
  Background,
  DeckCardMouseUpEvent,
  DeckZone,
  Loading,
  ScrollableArea,
  Select,
} from "@/ui/Shared";
import { Type } from "@/ui/Shared/DeckZone";
import { SaveReplayButton } from "@/ui/Shared/SaveReplayButton";
import { TrainingModal } from "@/ui/Training/TrainingModal";

import { CardDetail } from "./CardDetail";
import { DeckDatabase } from "./DeckDatabase";
import { DeckSelect } from "./DeckSelect";
import styles from "./index.module.scss";
import { editDeckStore } from "./store";
import {
  copyDeckToClipboard,
  downloadDeckAsYDK,
  editingDeckToIDeck,
} from "./utils";

export const loader: LoaderFunction = async () => {
  // 必须先加载卡组，不然页面会崩溃
  if (!initStore.decks) {
    await new Promise<void>((rs) => {
      subscribeKey(initStore, "decks", (done) => done && rs());
    });
  }

  // 同时，等待禁卡表的加载
  if (!initStore.forbidden) {
    await new Promise<void>((rs) => {
      subscribeKey(initStore, "forbidden", (done) => done && rs());
    });
  }

  // 最后，等待I18N文案的加载
  if (!initStore.i18n) {
    await new Promise<void>((rs) => {
      subscribeKey(initStore, "i18n", (done) => done && rs());
    });
  }

  // 更新场景
  changeScene(AudioActionType.BGM_DECK);

  return null;
};

export const selectedCard = proxy({
  id: 23995346,
  open: false,
});

export const Component: React.FC = () => {
  // 从浏览器历史返回编辑器时也结束训练，防止旧连接继续更新对局状态。
  useEffect(() => {
    if (trainingStore.session) {
      disconnectSession();
      resetUniverse();
    }
  }, []);
  const snapDecks = useSnapshot(deckStore);
  const { progress } = useSnapshot(initStore.sqlite);
  const {
    deck: snapSelectedDeck,
    entryId,
    saving,
    loading,
    error: saveError,
  } = useSnapshot(deckDraftStore.state);
  const { message, modal } = App.useApp();
  const { t: i18n } = useTranslation("BuildDeck");
  useEffect(() => {
    deckDraftStore.resume();
    void deckDraftStore.sync();
  }, []);

  const selectEntry = async (id: string) => {
    const select = async (discard = false) => {
      try {
        const result = await deckDraftStore.select(id, discard);
        if (result === "confirm")
          modal.confirm({
            title: "当前卡组有未保存的修改",
            content: "切换卡组会放弃这些修改。",
            okText: "放弃修改并切换",
            cancelText: "继续编辑",
            onOk: () => select(true),
          });
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : "加载卡组失败，请重试",
        );
      }
    };
    await select();
  };
  const handleDeckEditorReset = async () => {
    if (await deckDraftStore.reset()) message.info(i18n("ResetSuccessful"));
  };
  const handleDeckEditorSave = async () => {
    try {
      const saved = await deckDraftStore.save();
      if (saved)
        message.success(
          saved.id.startsWith("cloud:")
            ? "已保存到云端"
            : i18n("SaveSuccessful"),
        );
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "保存失败，请重试",
      );
    }
  };
  const saveLocalCopy = async () => {
    try {
      if (await deckDraftStore.saveLocalCopy())
        message.success("已另存为本地卡组");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "本地保存失败，请重试",
      );
    }
  };

  const handleDeckEditorShuffle = () => {
    editDeckStore.shuffle(editDeckStore);
  };

  const handleDeckEditorSort = () => {
    editDeckStore.sort(editDeckStore);
  };

  return (
    <DndProvider options={HTML5toTouch}>
      <Background />
      <div className={styles.layout} style={{ width: "100%" }}>
        <div className={styles.sider}>
          <DeckSelect
            decks={snapDecks.decks as IDeck[]}
            selected={snapSelectedDeck.deckName}
            selectedId={entryId}
            onSelect={(name) => void selectEntry(localDeckId(name))}
            onSelectCloud={(id) => void selectEntry(id)}
            onDeleteCloud={async (id) => {
              if (deckDraftStore.state.saving)
                throw new Error("请等待保存完成后再删除");
              await deckLibraryStore.deleteCloud(id);
            }}
            onDelete={async (name) => {
              if (deckDraftStore.state.saving)
                throw new Error("请等待保存完成后再删除");
              await deckStore.delete(name);
              await deckDraftStore.sync();
            }}
            onDownload={(name) => {
              const deck = deckStore.get(name);
              if (deck) downloadDeckAsYDK(deck);
            }}
            onCopy={async (name) => {
              const deck = deckStore.get(name);
              if (deck) return await copyDeckToClipboard(deck);
              else return false;
            }}
          />
          <HigherCardDetail />
        </div>
        <div className={styles.content}>
          {progress === 1 ? (
            <>
              <div className={styles.deck}>
                <DeckEditor
                  cloud={entryId.startsWith("cloud:")}
                  saving={saving}
                  loading={loading}
                  saveError={saveError}
                  onSaveLocal={saveLocalCopy}
                  onClear={editDeckStore.clear}
                  onReset={handleDeckEditorReset}
                  onSave={handleDeckEditorSave}
                  onShuffle={handleDeckEditorShuffle}
                  onSort={handleDeckEditorSort}
                />
              </div>
              <div className={styles.select}>
                <DeckDatabase />
              </div>
            </>
          ) : (
            <div className={styles.container}>
              <Loading progress={progress * 100} />
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};
Component.displayName = "Build";

/** 正在编辑的卡组 */
export const DeckEditor: React.FC<{
  cloud?: boolean;
  saving?: boolean;
  loading?: boolean;
  saveError?: string;
  onSaveLocal?: () => void;
  onShuffle: () => void;
  onSort: () => void;
  onClear: () => void;
  onReset: () => void;
  onSave: () => void;
}> = ({
  cloud,
  saving,
  loading,
  saveError,
  onSaveLocal,
  onClear,
  onReset,
  onSave,
  onShuffle,
  onSort,
}) => {
  const snapEditDeck = useSnapshot(editDeckStore);
  const { environment: env, selected, revision } = useSnapshot(banlistStore);
  const selectedBanlist = env === "408" ? forbidden_408 : forbidden;
  const banlistOptions = useMemo(
    () =>
      selectedBanlist.itemsFor(banlistStore.environment).map((item) => ({
        value: selectedBanlist.key(item),
        label: item.name,
      })),
    [selectedBanlist, env, revision],
  );
  const preferredBanlistKey = selected[env];
  const selectedBanlistKey =
    banlistOptions.find((option) => option.value === preferredBanlistKey)
      ?.value ?? banlistOptions[0]?.value;
  const [trainingOpen, setTrainingOpen] = useState(false);

  const handleEnvChange = (value: unknown) => {
    if (value === "ocg" || value === "tcg" || value === "408")
      banlistStore.environment = value;
  };

  // 中键换区域与右键删除都携带索引，保证操作用户选中的同名卡副本。
  const handleSwitchCard = (type: Type, card: CardMeta, index?: number) => {
    const cardType = card.data.type ?? 0;
    const isSide = type === "side";
    const targetType = isSide
      ? isExtraDeckCard(cardType)
        ? "extra"
        : "main"
      : "side";
    const { result, reason } = editDeckStore.canAdd(card, targetType, type);
    if (result) {
      editDeckStore.remove(type, card, index);
      editDeckStore.add(targetType, card);
    } else {
      message.error(reason);
    }
  };

  const showSelectedCard = (card: CardMeta) => {
    selectedCard.id = card.id;
    selectedCard.open = true;
  };

  const handleMouseUp = (
    type: "main" | "extra" | "side",
    payload: DeckCardMouseUpEvent,
  ) => {
    const { event, card, index } = payload;
    switch (event.button) {
      // 左键
      case 0:
        showSelectedCard(card);
        break;
      // 中键
      case 1:
        handleSwitchCard(type, card, index);
        break;
      // 右键
      case 2:
        editDeckStore.remove(type, card, index);
        break;
      default:
        break;
    }
    event.preventDefault();
  };
  const { t: i18n } = useTranslation("BuildDeck");
  return (
    <div className={styles.container}>
      <header className={styles.editorHeader} data-testid="deck-editor-header">
        <div className={styles.editorTitle}>
          <Input
            className={styles.deckName}
            placeholder={i18n("EnterTheDeckName")}
            variant="borderless"
            size="small"
            disabled={loading}
            prefix={<EditOutlined />}
            onChange={(e) => {
              editDeckStore.deckName = e.target.value;
              editDeckStore.edited = true;
            }}
            value={snapEditDeck.deckName}
          />
          <div className={styles.editorActions}>
            {[
              {
                label: i18n("Shuffle"),
                icon: <SwapOutlined />,
                onClick: onShuffle,
              },
              {
                label: i18n("Sort"),
                icon: <RetweetOutlined />,
                onClick: onSort,
              },
              {
                label: i18n("Clear"),
                icon: <DeleteOutlined />,
                onClick: onClear,
              },
              {
                label: i18n("Reset"),
                icon: <UndoOutlined />,
                onClick: onReset,
              },
            ].map(({ label, ...props }) => (
              <Tooltip key={label} title={label}>
                <Button
                  type="text"
                  size="small"
                  disabled={loading}
                  aria-label={label}
                  {...props}
                >
                  {label}
                </Button>
              </Tooltip>
            ))}
            <Button
              className={styles.editorSave}
              type={snapEditDeck.edited ? "primary" : "text"}
              size="small"
              icon={<CheckOutlined />}
              loading={saving}
              disabled={loading}
              data-testid="deck-save"
              aria-label={cloud ? "保存到云端" : "保存到本地"}
              onClick={() => onSave()}
            >
              {cloud ? "保存到云端" : "保存到本地"}
            </Button>
            {cloud && (
              <Button
                type="text"
                size="small"
                disabled={saving || loading}
                onClick={onSaveLocal}
              >
                另存为本地
              </Button>
            )}
            <Tooltip title={i18n("QuestionCircleTooltip")}>
              <Button
                type="text"
                size="small"
                aria-label={i18n("QuestionCircleTooltip")}
                icon={<QuestionCircleOutlined />}
              />
            </Tooltip>
          </div>
        </div>
        <div
          className={styles.saveStatus}
          role="status"
          data-testid="deck-save-status"
          data-error={!!saveError}
        >
          {saving
            ? "正在保存…"
            : saveError
            ? `${saveError}，修改已保留，可重试`
            : snapEditDeck.edited
            ? "未保存的修改"
            : cloud
            ? "云端卡组 · 已保存"
            : "本地卡组"}
        </div>
        <div className={styles.editorSettings}>
          <div className={styles.editorFilters}>
            <Select
              title={i18n("Environment")}
              aria-label={i18n("Environment")}
              data-testid="deck-environment-select"
              size="small"
              value={env}
              options={[
                { value: "ocg", label: "OCG" },
                { value: "tcg", label: "TCG" },
                { value: "408", label: "408" },
              ]}
              onChange={handleEnvChange}
            />
            <Select
              title={i18n("Banlist")}
              aria-label={i18n("Banlist")}
              data-testid="banlist-select"
              size="small"
              showSearch
              optionFilterProp="label"
              placeholder={i18n("NoBanlist")}
              disabled={!banlistOptions.length}
              value={selectedBanlistKey}
              options={banlistOptions}
              onChange={(value) => {
                if (typeof value === "string")
                  selectedBanlist.select(value, env);
              }}
            />
          </div>
          {/* 训练使用当前编辑内容，完整说明仍在训练设置中展示。 */}
          <div className={styles.editorTraining}>
            <Tooltip title={i18n("TrainingCurrentDeck")}>
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                data-testid="deck-start-training"
                disabled={loading || !snapEditDeck.main.length}
                onClick={() => setTrainingOpen(true)}
              >
                {i18n("StartTraining")}
              </Button>
            </Tooltip>
            <SaveReplayButton previous alwaysVisible size="small" type="text" />
          </div>
        </div>
      </header>
      <ScrollableArea className={styles["deck-zone"]}>
        {(["main", "extra", "side"] as const).map((type) => (
          <DeckZone
            key={type}
            type={type}
            cards={[...snapEditDeck[type]]}
            canAdd={editDeckStore.canAdd}
            onChange={(card, source, destination, sourceIndex) => {
              editDeckStore.add(destination, card);
              if (source !== "search") {
                editDeckStore.remove(source, card, sourceIndex);
              }
            }}
            onReorder={(from, before) =>
              editDeckStore.reorder(type, from, before)
            }
            onElementMouseUp={(event) => handleMouseUp(type, event)}
            onDoubleClick={(card) => {
              if (editDeckStore.canAdd(card, type, "search").result) {
                editDeckStore.add(type, card);
              }
            }}
            is408={env === "408"}
          />
        ))}
      </ScrollableArea>
      {/* 点击开始时再转换卡组，包含尚未保存的修改和拖动后的顺序。 */}
      <TrainingModal
        open={trainingOpen}
        onClose={() => setTrainingOpen(false)}
        getDeck={() => editingDeckToIDeck(editDeckStore)}
      />
    </div>
  );
};

const HigherCardDetail: React.FC = () => {
  const { id, open } = useSnapshot(selectedCard);
  return (
    <CardDetail
      open={open}
      code={id}
      onClose={() => (selectedCard.open = false)}
    />
  );
};

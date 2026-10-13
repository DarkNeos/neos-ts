import { App, Dropdown, Pagination } from "antd";
import React, { memo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { type INTERNAL_Snapshot as Snapshot, useSnapshot } from "valtio";

import { MdproDeckLike } from "@/api/mdproDeck/schema";
import { useConfig } from "@/config";
import { accountStore } from "@/stores";
import { deckDraftStore } from "@/stores/deckDraftStore";
import { mdproDeckStore } from "@/stores/mdproDeckStore";
import { IconFont, Loading } from "@/ui/Shared";

import styles from "./index.module.scss";

const { assetsPath } = useConfig();

export const DeckResults: React.FC = memo(() => {
  const snap = useSnapshot(mdproDeckStore.state);
  const { user } = useSnapshot(accountStore);
  const { message } = App.useApp();
  const { t: i18n } = useTranslation("DeckResults");
  useEffect(() => {
    mdproDeckStore.setAccount(user);
    if (!mdproDeckStore.state.loaded) void mdproDeckStore.load();
  }, [user]);
  useEffect(() => {
    if (snap.error) message.error(snap.error);
  }, [snap.errorRevision, snap.error, message]);

  const onChangePage = (page: number) => void mdproDeckStore.setPage(page);

  return (
    <>
      {snap.loaded ? (
        snap.decks.length ? (
          <div className={styles.container}>
            <div className={styles["search-decks"]}>
              {snap.decks.map((deck) => (
                <MdproDeckBlock
                  key={deck.deckId}
                  deck={deck}
                  onlyMine={snap.onlyMine}
                />
              ))}
            </div>
            <div style={{ textAlign: "center", padding: "0.625rem 0 1.25rem" }}>
              <Pagination
                current={snap.page}
                onChange={onChangePage}
                total={snap.total}
                pageSize={mdproDeckStore.pageSize}
                showLessItems
                hideOnSinglePage
              />
            </div>
          </div>
        ) : (
          <div className={styles.empty}>
            <IconFont type="icon-empty" size={40} />
            <div>{i18n("NoDeckGroupFound")}</div>
          </div>
        )
      ) : (
        <div className={styles.empty}>
          <Loading />
        </div>
      )}
    </>
  );
});

const MdproDeckBlock: React.FC<{
  deck: Snapshot<MdproDeckLike>;
  onlyMine: boolean;
}> = ({ deck, onlyMine }) => {
  const { message, modal } = App.useApp();
  const deleting = useRef(false);

  const onDelete = async (ownerId: number | undefined) => {
    if (deleting.current) return;
    const owner = accountStore.user;
    if (!owner || owner.id !== ownerId) {
      const text = "账号已切换，请重新打开删除确认";
      message.error(text);
      throw new Error(text);
    }
    deleting.current = true;
    try {
      mdproDeckStore.setAccount(owner);
      const result = await mdproDeckStore.delete(deck.deckId);
      message[result.ok ? "success" : "error"](result.message);
      if (!result.ok) throw new Error(result.message);
    } finally {
      deleting.current = false;
    }
  };

  const items = [];
  if (onlyMine) {
    items.push({
      key: 0,
      label: "删除",
      danger: true,
      onClick: () => {
        const ownerId = accountStore.user?.id;
        modal.confirm({
          title: "删除云卡组",
          content: (
            <>
              <p>将删除云端保存的卡组：{deck.deckName}。</p>
              <p>
                删除会同步到其他设备，无法撤销。该卡组未保存的修改也会被放弃，已另存的本地副本不受影响。
              </p>
            </>
          ),
          okText: "删除云端卡组",
          cancelText: "取消",
          okButtonProps: { danger: true },
          onOk: () => onDelete(ownerId),
        });
      },
    });
  }

  return (
    <Dropdown
      menu={{
        items,
      }}
      trigger={["contextMenu"]}
    >
      <div
        data-testid="mdpro-online-deck"
        data-deck-id={deck.deckId}
        className={styles["mdpro-deck"]}
        onClick={() => {
          const select = async (discard = false) => {
            try {
              const result = await deckDraftStore.preview(deck.deckId, discard);
              if (result === "confirm")
                modal.confirm({
                  title: "当前卡组有未保存的修改",
                  content: "打开另一套卡组会放弃这些修改。",
                  okText: "放弃修改并打开",
                  cancelText: "继续编辑",
                  onOk: () => select(true),
                });
            } catch (error) {
              message.error(
                error instanceof Error ? error.message : "加载卡组失败，请重试",
              );
            }
          };
          void select();
        }}
      >
        <img
          src={`${assetsPath}/deck-cases/DeckCase${
            deck.deckCase === 0 ? "0001" : deck.deckCase.toString().slice(-4)
          }_L.png`}
        />
        <div className={styles.text}>
          <div>{truncateString(deck.deckName, 8)}</div>
          <div>{`By ${truncateString(deck.deckContributor, 6)}`}</div>
        </div>
      </div>
    </Dropdown>
  );
};

function truncateString(str: string, maxLen: number): string {
  const length = Array.from(str).length;

  if (length <= maxLen) {
    return str;
  }

  const start = Array.from(str).slice(0, 3).join("");
  const end = Array.from(str).slice(-3).join("");

  return `${start}...${end}`;
}

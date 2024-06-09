import { message, Pagination } from "antd";
import React, { memo, useEffect } from "react";
import { type INTERNAL_Snapshot as Snapshot, proxy, useSnapshot } from "valtio";
import YGOProDeck from "ygopro-deck-encode";

import { pullDecks } from "@/api";
import { MdproDeck } from "@/api/mdproDeck/schema";
import { useConfig } from "@/config";
import { IconFont } from "@/ui/Shared";

import { setSelectedDeck } from "../..";
import { editDeckStore } from "../../store";
import { iDeckToEditingDeck } from "../../utils";
import styles from "./index.module.scss";

const { assetsPath } = useConfig();

interface Props {
  query: string;
  page: number;
  decks: MdproDeck[];
  total: number;
}

// TODO: useConfig
const PAGE_SIZE = 30;
const SORT_LIKE = true;

const store = proxy<Props>({ query: "", page: 1, decks: [], total: 0 });

export const DeckResults: React.FC = memo(() => {
  const snap = useSnapshot(store);

  useEffect(() => {
    const update = async () => {
      const resp = await pullDecks({
        page: snap.page,
        size: PAGE_SIZE,
        keyWord: snap.query !== "" ? snap.query : undefined,
        sortLike: SORT_LIKE,
      });

      if (resp?.data) {
        const { total, records: newDecks } = resp.data;
        store.total = total;
        store.decks = newDecks;
      } else {
        store.decks = [];
      }
    };

    update();
  }, [snap.query, snap.page]);

  const onChangePage = async (page: number) => {
    const resp = await pullDecks({
      page,
      size: PAGE_SIZE,
      keyWord: store.query !== "" ? store.query : undefined,
      sortLike: SORT_LIKE,
    });

    if (resp?.data) {
      const { current, total, records } = resp.data;
      store.page = current;
      store.total = total;
      store.decks = records;
    } else if (resp?.code !== 0) {
      message.error(resp?.message);
    } else {
      message.error("翻页失败，请检查您的网络状况。");
    }
  };

  return (
    <>
      {snap.decks.length ? (
        <div className={styles.container}>
          <div className={styles["search-decks"]}>
            {snap.decks.map((deck) => (
              <MdproDeckBlock key={deck.deckId} {...deck} />
            ))}
          </div>
          <div style={{ textAlign: "center", padding: "0.625rem 0 1.25rem" }}>
            <Pagination
              current={snap.page}
              onChange={onChangePage}
              total={snap.total}
              pageSize={PAGE_SIZE}
              showLessItems
              hideOnSinglePage
            />
          </div>
        </div>
      ) : (
        <div className={styles.empty}>
          <IconFont type="icon-empty" size={40} />
          <div>找不到相应卡组</div>
        </div>
      )}
    </>
  );
});

const MdproDeckBlock: React.FC<Snapshot<MdproDeck>> = (deck) => (
  <div
    className={styles["mdpro-deck"]}
    onClick={async () => await copyMdproDeckToEditing(deck)}
  >
    <img
      src={`${assetsPath}/deck-cases/DeckCase${deck.deckCase
        .toString()
        .slice(-4)}_L.png`}
    />
    <div className={styles.text}>
      <div>{truncateString(deck.deckName, 8)}</div>
      <div>{`By ${truncateString(deck.deckContributor, 6)}`}</div>
    </div>
  </div>
);

const copyMdproDeckToEditing = async (mdproDeck: MdproDeck) => {
  const deck = YGOProDeck.fromYdkString(mdproDeck.deckYdk);

  if (!(deck.main.length + deck.extra.length + deck.side.length === 0)) {
    const deckName = mdproDeck.deckName;
    const ideck = { deckName, ...deck };
    const editingDeck = await iDeckToEditingDeck(ideck);

    setSelectedDeck(ideck);
    editDeckStore.set(editingDeck);
  } else {
    message.error("卡组解析失败，请联系技术人员解决：<ccc@neos.moe>");
  }
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

export const freshMdrpoDecks = (query: string) => (store.query = query);

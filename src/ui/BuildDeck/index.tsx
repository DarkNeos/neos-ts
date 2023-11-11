import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  RetweetOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SwapOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Dropdown,
  Input,
  type MenuProps,
  message,
  Pagination,
  Space,
} from "antd";
import { isEqual } from "lodash-es";
import { type OverlayScrollbarsComponentRef } from "overlayscrollbars-react";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useDrop } from "react-dnd";
import { DndProvider } from "react-dnd-multi-backend";
import { LoaderFunction } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";
import { subscribeKey } from "valtio/utils";

import { type CardMeta, searchCards } from "@/api";
import { isExtraDeckCard, isToken } from "@/common";
import { FtsConditions } from "@/middleware/sqlite/fts";
import { deckStore, emptyDeck, type IDeck, initStore } from "@/stores";
import {
  Background,
  DeckCard,
  DeckCardMouseUpEvent,
  DeckZone,
  IconFont,
  Loading,
  ScrollableArea,
} from "@/ui/Shared";
import { Type } from "@/ui/Shared/DeckZone";

import { CardDetail } from "./CardDetail";
import { DeckSelect } from "./DeckSelect";
import { Filter } from "./Filter";
import styles from "./index.module.scss";
import { editDeckStore } from "./store";
import {
  copyDeckToClipboard,
  downloadDeckAsYDK,
  editingDeckToIDeck,
  iDeckToEditingDeck,
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

  return null;
};

export const Component: React.FC = () => {
  const snapDecks = useSnapshot(deckStore);
  const { progress } = useSnapshot(initStore.sqlite);
  const [selectedDeck, setSelectedDeck] = useState<IDeck>(
    deckStore.decks.at(0) ?? emptyDeck,
  );

  const { message } = App.useApp();

  const handleDeckEditorReset = async () => {
    editDeckStore.set(await iDeckToEditingDeck(selectedDeck));
    message.info("重置成功");
  };

  const handleDeckEditorSave = async () => {
    const tmpIDeck = editingDeckToIDeck(editDeckStore);
    const result = await deckStore.update(selectedDeck.deckName, tmpIDeck);
    if (result) {
      setSelectedDeck(tmpIDeck);
      message.info("保存成功");
      editDeckStore.edited = false;
    } else {
      editDeckStore.set(await iDeckToEditingDeck(selectedDeck));
      message.error("保存失败");
      editDeckStore.edited = false;
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
          <ScrollableArea className={styles["deck-select-container"]}>
            <DeckSelect
              decks={snapDecks.decks}
              selected={selectedDeck.deckName}
              onSelect={(name) =>
                setSelectedDeck(deckStore.get(name) ?? emptyDeck)
              }
              onDelete={async (name) => await deckStore.delete(name)}
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
          </ScrollableArea>
          <HigherCardDetail />
        </div>
        <div className={styles.content}>
          {progress === 1 ? (
            <>
              <div className={styles.deck}>
                <DeckEditor
                  deck={selectedDeck}
                  onClear={editDeckStore.clear}
                  onReset={handleDeckEditorReset}
                  onSave={handleDeckEditorSave}
                  onShuffle={handleDeckEditorShuffle}
                  onSort={handleDeckEditorSort}
                />
              </div>
              <div className={styles.select}>
                <Search />
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
  deck: IDeck;
  onShuffle: () => void;
  onSort: () => void;
  onClear: () => void;
  onReset: () => void;
  onSave: () => void;
}> = ({ deck, onClear, onReset, onSave, onShuffle, onSort }) => {
  const snapEditDeck = useSnapshot(editDeckStore);
  const [deckName, setDeckName] = useState(editDeckStore.deckName);

  useEffect(() => {
    iDeckToEditingDeck(deck).then(editDeckStore.set);
    setDeckName(deck.deckName);
  }, [deck]);
  useEffect(() => {
    editDeckStore.deckName = deckName;
  }, [deckName]);

  const handleSwitchCard = (type: Type, card: CardMeta) => {
    const cardType = card.data.type ?? 0;
    const isSide = type === "side";
    const targetType = isSide
      ? isExtraDeckCard(cardType)
        ? "extra"
        : "main"
      : "side";
    const { result, reason } = editDeckStore.canAdd(card, targetType, type);
    if (result) {
      editDeckStore.remove(type, card);
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
    const { event, card } = payload;
    switch (event.button) {
      // 左键
      case 0:
        showSelectedCard(card);
        break;
      // 中键
      case 1:
        handleSwitchCard(type, card);
        break;
      // 右键
      case 2:
        editDeckStore.remove(type, card);
        break;
      default:
        break;
    }
    event.preventDefault();
  };

  return (
    <div className={styles.container}>
      <Space className={styles.title}>
        <Input
          placeholder="请输入卡组名字"
          bordered={false}
          prefix={<EditOutlined />}
          style={{ width: "8.8rem" }}
          onChange={(e) => setDeckName(e.target.value)}
          value={deckName}
        />
        <Space style={{ marginRight: "0.4rem" }} size={5}>
          <Button
            type="text"
            size="small"
            icon={<SwapOutlined />}
            onClick={onShuffle}
          >
            打乱
          </Button>
          <Button
            type="text"
            size="small"
            icon={<RetweetOutlined />}
            onClick={onSort}
          >
            排序
          </Button>
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={onClear}
          >
            清空
          </Button>
          <Button
            type="text"
            size="small"
            icon={<UndoOutlined />}
            onClick={() => onReset()}
          >
            重置
          </Button>
          <Button
            type={snapEditDeck.edited ? "primary" : "text"}
            size="small"
            icon={<CheckOutlined />}
            onClick={() => onSave()}
          >
            保存
          </Button>
        </Space>
      </Space>
      <ScrollableArea className={styles["deck-zone"]}>
        {(["main", "extra", "side"] as const).map((type) => (
          <DeckZone
            key={type}
            type={type}
            cards={[...snapEditDeck[type]]}
            canAdd={editDeckStore.canAdd}
            onChange={(card, source, destination) => {
              editDeckStore.add(destination, card);
              if (source !== "search") {
                editDeckStore.remove(source, card);
              }
            }}
            onElementMouseUp={(event) => handleMouseUp(type, event)}
          />
        ))}
      </ScrollableArea>
    </div>
  );
};

/** 卡片库，选择卡片加入正在编辑的卡组 */
const Search: React.FC = () => {
  const { modal } = App.useApp();
  const [searchWord, setSearchWord] = useState("");
  const emptySearchConditions: FtsConditions = {
    atk: { min: null, max: null },
    def: { min: null, max: null },
    levels: [],
    lscales: [],
    races: [],
    attributes: [],
    types: [],
  };
  const [searchConditions, setSearchConditions] = useState<FtsConditions>(
    emptySearchConditions,
  );
  const [searchResult, setSearchResult] = useState<CardMeta[]>([]);

  const defaultSort = (a: CardMeta, b: CardMeta) => a.id - b.id;
  const sortRef = useRef<(a: CardMeta, b: CardMeta) => number>(defaultSort);
  const [sortEdited, setSortEdited] = useState(false);

  const setSortRef = (sort: (a: CardMeta, b: CardMeta) => number) => {
    sortRef.current = sort;
    setSearchResult([...searchResult.sort(sortRef.current)]);
    setSortEdited(true);
  };

  const genSort = (key: keyof CardMeta["data"], scale: 1 | -1 = 1) => {
    return () =>
      setSortRef(
        (a: CardMeta, b: CardMeta) =>
          ((a.data?.[key] ?? 0) - (b.data?.[key] ?? 0)) * scale,
      );
  };

  const dropdownOptions: MenuProps["items"] = (
    [
      ["从新到旧", () => setSortRef((a, b) => b.id - a.id)],
      ["从旧到新", () => setSortRef((a, b) => a.id - b.id)],
      ["攻击力从高到低", genSort("atk", -1)],
      ["攻击力从低到高", genSort("atk")],
      ["守备力从高到低", genSort("def", -1)],
      ["守备力从低到高", genSort("def")],
      ["星/阶/刻/Link从高到低", genSort("level", -1)],
      ["星/阶/刻/Link从低到高", genSort("level")],
      ["灵摆刻度从高到低", genSort("lscale", -1)],
      ["灵摆刻度从低到高", genSort("lscale")],
    ] as const
  ).map(([label, onClick], key) => ({ key, label, onClick }));

  const handleSearch = (conditions: FtsConditions = searchConditions) => {
    const result = searchCards({ query: searchWord, conditions })
      .filter((card) => !isToken(card.data.type ?? 0))
      .sort(sortRef.current); // 衍生物不显示
    setSearchResult(() => result);
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const [_, dropRef] = useDrop({
    accept: ["Card"], // 指明该区域允许接收的拖放物。可以是单个，也可以是数组
    // 里面的值就是useDrag所定义的type
    // 当拖拽物在这个拖放区域放下时触发,这个item就是拖拽物的item（拖拽物携带的数据）
    drop: ({ value, source }: { value: CardMeta; source: Type | "search" }) => {
      if (source !== "search") {
        editDeckStore.remove(source, value);
      }
    },
  });

  const showFilterModal = () => {
    const { destroy } = modal.info({
      width: 500,
      centered: true,
      title: null,
      icon: null,
      content: (
        <Filter
          conditions={searchConditions}
          onConfirm={(newConditions) => {
            setSearchConditions(newConditions);
            destroy();
            setTimeout(() => handleSearch(newConditions), 200); // 先收起再搜索
          }}
          onCancel={() => destroy()}
        />
      ),
      footer: null,
    });
  };

  /** 滚动条的ref，用来在翻页之后快速回顶 */
  const ref = useRef<OverlayScrollbarsComponentRef<"div">>(null);
  const scrollToTop = useCallback(() => {
    const viewport = ref.current?.osInstance()?.elements().viewport;
    if (viewport) viewport.scrollTop = 0;
  }, []);

  return (
    <div className={styles.container} ref={dropRef}>
      <div className={styles.title}>
        <Input
          placeholder="关键词(空格分隔)"
          bordered={false}
          suffix={
            <Button
              type="text"
              icon={<SearchOutlined />}
              onClick={() => handleSearch()}
            />
          }
          value={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
          onKeyUp={(e) => e.key === "Enter" && handleSearch()}
          allowClear
        />
      </div>
      <div className={styles["select-btns"]}>
        <Button
          block
          type={
            isEqual(emptySearchConditions, searchConditions)
              ? "text"
              : "primary"
          }
          icon={<FilterOutlined />}
          onClick={showFilterModal}
        >
          筛选
        </Button>
        <Dropdown
          menu={{ items: dropdownOptions }}
          trigger={["click"]}
          placement="bottom"
          arrow
        >
          <Button
            block
            type={sortEdited ? "primary" : "text"}
            icon={<SortAscendingOutlined />}
          >
            <span>
              排列
              <span className={styles["search-count"]}>
                ({searchResult.length})
              </span>
            </span>
          </Button>
        </Dropdown>
        <Button
          block
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => {
            setSearchConditions(emptySearchConditions);
            setSortRef(defaultSort);
            setSortEdited(false);
            handleSearch(emptySearchConditions);
          }}
        >
          重置
        </Button>
      </div>
      <ScrollableArea className={styles["search-cards-container"]} ref={ref}>
        {searchResult.length ? (
          <SearchResults results={searchResult} scrollToTop={scrollToTop} />
        ) : (
          <div className={styles.empty}>
            <IconFont type="icon-empty" size={40} />
            <div>无搜索结果</div>
          </div>
        )}
      </ScrollableArea>
    </div>
  );
};

/** 搜索区的搜索结果，使用memo避免重复渲染 */
const SearchResults: React.FC<{
  results: CardMeta[];
  scrollToTop: () => void;
}> = memo(({ results, scrollToTop }) => {
  const itemsPerPage = 196; // 每页显示的数据数量
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = results.slice(startIndex, endIndex);

  const showSelectedCard = (card: CardMeta) => {
    selectedCard.id = card.id;
    selectedCard.open = true;
  };

  const handleAddCardToMain = (card: CardMeta) => {
    const cardType = card.data.type ?? 0;
    const isExtraCard = isExtraDeckCard(cardType);
    const type = isExtraCard ? "extra" : "main";
    const { result, reason } = editDeckStore.canAdd(card, type, "search");
    if (result) {
      editDeckStore.add(type, card);
    } else {
      message.error(reason);
    }
  };

  const handleAddCardToSide = (card: CardMeta) => {
    const { result, reason } = editDeckStore.canAdd(card, "side", "search");
    if (result) {
      editDeckStore.add("side", card);
    } else {
      message.error(reason);
    }
  };

  /** safari 不支持 onAuxClick，所以使用 mousedown 模拟 */
  const handleMouseUp = (payload: DeckCardMouseUpEvent) => {
    const { event, card } = payload;
    switch (event.button) {
      // 左键
      case 0:
        showSelectedCard(card);
        break;
      // 中键
      case 1:
        handleAddCardToSide(card);
        break;
      // 右键
      case 2:
        handleAddCardToMain(card);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className={styles["search-cards"]}>
        {currentData.map((card) => (
          <DeckCard
            value={card}
            key={card.id}
            source="search"
            onMouseUp={handleMouseUp}
            onMouseEnter={() => showSelectedCard(card)}
          />
        ))}
      </div>
      {results.length > itemsPerPage && (
        <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
          <Pagination
            current={currentPage}
            onChange={(page) => {
              setCurrentPage(page);
              scrollToTop();
            }}
            total={results.length}
            pageSize={itemsPerPage}
            showSizeChanger={false}
            showLessItems
            hideOnSinglePage
          />
        </div>
      )}
    </>
  );
});

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

const selectedCard = proxy({
  id: 23995346,
  open: false,
});

import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Dropdown,
  Input,
  type MenuProps,
  Pagination,
  Space,
} from "antd";
import classNames from "classnames";
import { isEqual } from "lodash-es";
import { type OverlayScrollbarsComponentRef } from "overlayscrollbars-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { LoaderFunction } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";
import { subscribeKey } from "valtio/utils";

import { type CardMeta, initForbiddens, searchCards } from "@/api";
import { isToken } from "@/common";
import { FtsConditions } from "@/middleware/sqlite/fts";
import { deckStore, type IDeck, initStore } from "@/stores";
import {
  Background,
  IconFont,
  Loading,
  ScrollableArea,
  YgoCard,
} from "@/ui/Shared";

import { CardDetail } from "./CardDetail";
import { DeckSelect } from "./DeckSelect";
import { Filter } from "./Filter";
import styles from "./index.module.scss";
import { editDeckStore } from "./store";
import {
  downloadDeckAsYDK,
  editingDeckToIDeck,
  iDeckToEditingDeck,
  type Type,
} from "./utils";

export const loader: LoaderFunction = async () => {
  // 必须先加载卡组，不然页面会崩溃
  if (!initStore.decks) {
    await new Promise<void>((rs) => {
      subscribeKey(initStore, "decks", (done) => done && rs());
    });
  }

  // 更新禁限卡表
  await initForbiddens();
  return null;
};

export const Component: React.FC = () => {
  const snapDecks = useSnapshot(deckStore);
  const { sqlite } = useSnapshot(initStore);
  const [selectedDeck, setSelectedDeck] = useState<IDeck>(deckStore.decks[0]);

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

  return (
    <DndProvider backend={HTML5Backend}>
      <Background />
      <div className={styles.layout} style={{ width: "100%" }}>
        <div className={styles.sider}>
          <ScrollableArea className={styles["deck-select-container"]}>
            <DeckSelect
              decks={snapDecks.decks}
              selected={selectedDeck.deckName}
              onSelect={(name) =>
                setSelectedDeck(deckStore.get(name) ?? deckStore.decks[0])
              }
              onDelete={async (name) => await deckStore.delete(name)}
              onDownload={(name) => {
                const deck = deckStore.get(name);
                if (deck) downloadDeckAsYDK(deck);
              }}
            />
          </ScrollableArea>
          <HigherCardDetail />
        </div>
        <div className={styles.content}>
          <div className={styles.deck}>
            <DeckEditor
              deck={selectedDeck}
              onClear={editDeckStore.clear}
              onReset={handleDeckEditorReset}
              onSave={handleDeckEditorSave}
            />
          </div>
          <div className={styles.select}>
            {sqlite.progress === 1 ? (
              <Search />
            ) : (
              <div className={styles.container}>
                <Loading />
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
Component.displayName = "Build";

/** 正在编辑的卡组 */
const DeckEditor: React.FC<{
  deck: IDeck;
  onClear: () => void;
  onReset: () => void;
  onSave: () => void;
}> = ({ deck, onClear, onReset, onSave }) => {
  const snapEditDeck = useSnapshot(editDeckStore);
  useEffect(() => {
    iDeckToEditingDeck(deck).then(editDeckStore.set);
  }, [deck]);
  return (
    <div className={styles.container}>
      <Space className={styles.title}>
        <Input
          placeholder="请输入卡组名字"
          bordered={false}
          prefix={<EditOutlined />}
          style={{ width: 400 }}
          onChange={(e) =>
            editDeckStore.set({
              ...editDeckStore,
              deckName: e.target.value,
            })
          }
          value={snapEditDeck.deckName}
        />
        <Space style={{ marginRight: 6 }}>
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
          <DeckZone key={type} type={type} />
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
    emptySearchConditions
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
          ((a.data?.[key] ?? 0) - (b.data?.[key] ?? 0)) * scale
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

  const handleSearch = async (conditions: FtsConditions = searchConditions) => {
    const result = (await searchCards({ query: searchWord, conditions }))
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
          placeholder="搜索卡片"
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

/** 正在组卡的zone，包括main/extra/side */
const DeckZone: React.FC<{
  type: Type;
}> = ({ type }) => {
  const { message } = App.useApp();
  const cards = useSnapshot(editDeckStore)[type];
  const [allowToDrop, setAllowToDrop] = useState(false);
  const [{ isOver }, dropRef] = useDrop({
    accept: ["Card"], // 指明该区域允许接收的拖放物。可以是单个，也可以是数组
    // 里面的值就是useDrag所定义的type
    // 当拖拽物在这个拖放区域放下时触发,这个item就是拖拽物的item（拖拽物携带的数据）
    drop: ({ value, source }: { value: CardMeta; source: Type | "search" }) => {
      if (type === source) return;
      const { result, reason } = editDeckStore.canAdd(value, type);
      if (result) {
        editDeckStore.add(type, value);
        if (source !== "search") {
          editDeckStore.remove(source, value);
        }
      } else {
        message.error(reason);
      }
    },
    hover: ({ value, source }) => {
      setAllowToDrop(
        type !== source ? editDeckStore.canAdd(value, type).result : true
      );
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  return (
    <div
      className={classNames(styles[type], {
        [styles.over]: isOver,
        [styles["not-allow-to-drop"]]: isOver && !allowToDrop,
      })}
      ref={dropRef}
    >
      <div className={styles["card-continer"]}>
        {cards.map((card, i) => (
          <Card
            value={card}
            key={card.id + i + type}
            source={type}
            onRightClick={() => editDeckStore.remove(type, card)}
          />
        ))}
        <div className={styles["editing-zone-name"]}>{type.toUpperCase()}</div>
      </div>
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

  return (
    <>
      <div className={styles["search-cards"]}>
        {currentData.map((card) => (
          <Card value={card} key={card.id} source="search" />
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

/** 本组件内使用的单张卡片，增加了文字在图片下方 */
const Card: React.FC<{
  value: CardMeta;
  source: Type | "search";
  onRightClick?: () => void;
}> = memo(({ value, source, onRightClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: "Card",
    item: { value, source },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drag(ref);
  const [showText, setShowText] = useState(true);
  return (
    <div
      className={styles.card}
      ref={ref}
      style={{ opacity: isDragging && source !== "search" ? 0 : 1 }}
      onClick={() => {
        selectedCard.id = value.id;
        selectedCard.open = true;
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick?.();
      }}
    >
      {showText && <div className={styles.cardname}>{value.text.name}</div>}
      <YgoCard
        className={styles.cardcover}
        code={value.id}
        onLoad={() => setShowText(false)}
      />
    </div>
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

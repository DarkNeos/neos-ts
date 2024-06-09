import {
  DeleteOutlined,
  FilterOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { App, Button, Dropdown, Input, Space } from "antd";
import { MenuProps } from "antd/lib";
import { isEqual } from "lodash-es";
import { OverlayScrollbarsComponentRef } from "overlayscrollbars-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDrop } from "react-dnd";

import { CardMeta, searchCards } from "@/api";
import { isToken } from "@/common";
import { emptySearchConditions, FtsConditions } from "@/middleware/sqlite/fts";
import { ScrollableArea, Type } from "@/ui/Shared";

import { Filter } from "../Filter";
import styles from "../index.module.scss";
import { editDeckStore } from "../store";
import { CardResults } from "./CardResults";
import { DeckResults, freshMdrpoDecks } from "./DeckResults";

/** 卡片库，选择卡片加入正在编辑的卡组 */
export const DeckDatabase: React.FC = () => {
  const { modal } = App.useApp();
  const [searchWord, setSearchWord] = useState("");
  const [searchConditions, setSearchConditions] = useState<FtsConditions>(
    emptySearchConditions,
  );
  const [searchCardResult, setSearchCardResult] = useState<CardMeta[]>([]);

  const defaultSort = (a: CardMeta, b: CardMeta) => a.id - b.id;
  const sortRef = useRef<(a: CardMeta, b: CardMeta) => number>(defaultSort);
  const [sortEdited, setSortEdited] = useState(false);

  const [showMdproDecks, setShowMdproDecks] = useState(false);

  const setSortRef = (sort: (a: CardMeta, b: CardMeta) => number) => {
    sortRef.current = sort;
    setSearchCardResult([...searchCardResult.sort(sortRef.current)]);
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
    if (showMdproDecks) {
      freshMdrpoDecks(searchWord);
    } else {
      const result = searchCards({ query: searchWord, conditions })
        .filter((card) => !isToken(card.data.type ?? 0))
        .sort(sortRef.current); // 衍生物不显示
      setSearchCardResult(() => result);
    }
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
      <Space className={styles.title} direction="horizontal">
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
          style={{ width: "250%" }}
        />
        <Button
          style={{ marginRight: "1rem" }}
          icon={<SwapOutlined />}
          onClick={() => setShowMdproDecks(!showMdproDecks)}
        >
          {showMdproDecks ? "卡片数据库" : "Mdpro在线卡组"}
        </Button>
      </Space>
      <div className={styles["select-btns"]}>
        <Button
          block
          type={
            isEqual(emptySearchConditions, searchConditions)
              ? "text"
              : "primary"
          }
          disabled={showMdproDecks}
          icon={<FilterOutlined />}
          onClick={showFilterModal}
        >
          筛选
        </Button>
        <Dropdown
          menu={{ items: dropdownOptions }}
          disabled={showMdproDecks}
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
                ({searchCardResult.length})
              </span>
            </span>
          </Button>
        </Dropdown>
        <Button
          block
          type="text"
          disabled={showMdproDecks}
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
        {showMdproDecks ? (
          <DeckResults />
        ) : (
          <CardResults results={searchCardResult} scrollToTop={scrollToTop} />
        )}
      </ScrollableArea>
    </div>
  );
};

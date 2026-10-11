import {
  DeleteOutlined,
  FilterOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { App, Button, Checkbox, Dropdown, Input } from "antd";
import { MenuProps } from "antd/lib";
import { isEqual } from "lodash-es";
import { OverlayScrollbarsComponentRef } from "overlayscrollbars-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";

import { CardMeta, searchCards } from "@/api";
import { isToken } from "@/common";
import { emptySearchConditions, FtsConditions } from "@/middleware/sqlite/fts";
import { mdproDeckStore } from "@/stores/mdproDeckStore";
import { DeckCardDragItem, ScrollableArea, Select } from "@/ui/Shared";

import { Filter } from "../Filter";
import styles from "../index.module.scss";
import { editDeckStore } from "../store";
import { CardResults } from "./CardResults";
import { DeckResults } from "./DeckResults";

/** 卡片库，选择卡片加入正在编辑的卡组 */
export const DeckDatabase: React.FC = () => {
  const { modal } = App.useApp();
  const [searchWord, setSearchWord] = useState("");
  const [namesOnly, setNamesOnly] = useState(false);
  const [searchConditions, setSearchConditions] = useState<FtsConditions>(
    emptySearchConditions,
  );
  const [searchCardResult, setSearchCardResult] = useState<CardMeta[]>([]);

  const defaultSort = (a: CardMeta, b: CardMeta) => a.id - b.id;
  const sortRef = useRef<(a: CardMeta, b: CardMeta) => number>(defaultSort);
  const [sortEdited, setSortEdited] = useState(false);

  const [showMdproDecks, setShowMdproDecks] = useState(false);
  const { onlyMine } = useSnapshot(mdproDeckStore.state);

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
  const { t } = useTranslation("BuildDeck");
  const dropdownOptions: MenuProps["items"] = (
    [
      [`${t("FromNewToOld")}`, () => setSortRef((a, b) => b.id - a.id)],
      [`${t("FromOldToNew")}`, () => setSortRef((a, b) => a.id - b.id)],
      [`${t("AttackPowerFromHighToLow")}`, genSort("atk", -1)],
      [`${t("AttackPowerFromLowToHigh")}`, genSort("atk")],
      [`${t("DefensePowerFromHighToLow")}`, genSort("def", -1)],
      [`${t("DefensePowerFromLowToHigh")}`, genSort("def")],
      [`${t("StarsRanksLevelsLinkFromHighToLow")}`, genSort("level", -1)],
      [`${t("StarsRanksLevelsLinkFromLowToHigh")}`, genSort("level")],
      [`${t("PendulumScaleFromHighToLow")}`, genSort("lscale", -1)],
      [`${t("PendulumScaleFromLowToHigh")}`, genSort("lscale")],
    ] as const
  ).map(([label, onClick], key) => ({ key, label, onClick }));

  const handleSearch = (conditions: FtsConditions = searchConditions) => {
    if (showMdproDecks) {
      void mdproDeckStore.search(searchWord);
    } else {
      const result = searchCards({ query: searchWord, conditions, namesOnly })
        .filter((card) => !isToken(card.data.type ?? 0))
        .sort(sortRef.current); // 衍生物不显示
      setSearchCardResult(() => result);
    }
  };

  useEffect(() => {
    // 搜索范围变化后立即更新已经显示的结果。
    handleSearch();
  }, [namesOnly]);

  const [_, dropRef] = useDrop({
    accept: ["Card"], // 指明该区域允许接收的拖放物。可以是单个，也可以是数组
    // 里面的值就是useDrag所定义的type
    // 当拖拽物在这个拖放区域放下时触发,这个item就是拖拽物的item（拖拽物携带的数据）
    drop: ({ value, source, index }: DeckCardDragItem) => {
      // 拖回搜索区表示删除，索引用于区分卡组中的多个同名副本。
      if (source !== "search") {
        editDeckStore.remove(source, value, index);
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
  const { t: i18n } = useTranslation("BuildDeck");
  return (
    <div className={styles.container} ref={dropRef}>
      <div className={`${styles.title} ${styles["database-title"]}`}>
        <Input
          data-testid="deck-search-input"
          placeholder={i18n("KeywordsPlaceholder")}
          variant="borderless"
          suffix={
            <Button
              data-testid="deck-search-submit"
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
        <Button
          icon={<SwapOutlined />}
          onClick={() => setShowMdproDecks(!showMdproDecks)}
        >
          {showMdproDecks ? i18n("CardDatabase") : i18n("MDProOnlineDeck")}
        </Button>
      </div>
      <div className={styles["select-btns"]}>
        {!showMdproDecks && (
          <Checkbox
            className={styles["search-name-only"]}
            data-testid="deck-search-name-only"
            checked={namesOnly}
            onChange={(event) => setNamesOnly(event.target.checked)}
          >
            {t("SearchNameOnly")}
          </Checkbox>
        )}
        {showMdproDecks ? (
          <Select
            title=""
            data-testid="mdpro-deck-scope"
            style={{ width: "18.90rem" }}
            value={onlyMine}
            options={[
              { value: true, label: i18n("OnlyShowDecksIUploaded") },
              { value: false, label: i18n("ShowAllOnlineDecks") },
            ]}
            onChange={(value) =>
              void mdproDeckStore.search(searchWord, value === true)
            }
          />
        ) : (
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
            {i18n("Filter")}
          </Button>
        )}
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
              {i18n("SortBy")}
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
          {i18n("Reset")}
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

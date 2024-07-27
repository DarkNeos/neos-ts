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
import { useTranslation } from "react-i18next";

import { CardMeta, searchCards } from "@/api";
import { isToken } from "@/common";
import { emptySearchConditions, FtsConditions } from "@/middleware/sqlite/fts";
import { ScrollableArea, Select, Type } from "@/ui/Shared";

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
  const { t: i18n } = useTranslation("BuildDeck");
  return (
    <div className={styles.container} ref={dropRef}>
      <Space className={styles.title} direction="horizontal">
        <Input
          placeholder={i18n("KeywordsPlaceholder")}
          variant="borderless"
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
          {showMdproDecks ? i18n("CardDatabase") : i18n("MDProOnlineDeck")}
        </Button>
      </Space>
      <div className={styles["select-btns"]}>
        {showMdproDecks ? (
          <Select
            title=""
            style={{ width: "18.90rem" }}
            defaultValue={false}
            options={[
              { value: true, label: i18n("OnlyShowDecksIUploaded") },
              { value: false, label: i18n("ShowAllOnlineDecks") },
            ]}
            onChange={
              // @ts-ignore
              (value) => freshMdrpoDecks(searchWord, value)
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

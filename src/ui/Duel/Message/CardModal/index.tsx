import { LeftOutlined } from "@ant-design/icons";
import { Divider, Drawer, Space, Tag } from "antd";
import React from "react";
import { proxy, useSnapshot } from "valtio";

import { type CardMeta, fetchStrings, Region } from "@/api";
import { YgoCard } from "@/ui/Shared";

import {
  Attribute2StringCodeMap,
  extraCardTypes,
  Race2StringCodeMap,
  TYPE_LINK,
  Type2StringCodeMap,
} from "../../../../common";
import { Desc } from "./Desc";
import styles from "./index.module.scss";

const CARD_WIDTH = "8.75rem";

const defaultStore = {
  isOpen: false,
  meta: {
    id: 0,
    data: {},
    text: {
      name: "",
      desc: "",
    },
  } satisfies CardMeta as CardMeta,
  interactivies: [] as {
    desc: string;
    response: number;
    effectCode?: number;
  }[],
  counters: {} as Record<number, number>,
};

const store = proxy(defaultStore);

export const CardModal = () => {
  const snap = useSnapshot(store);

  const { isOpen, meta, counters } = snap;

  const name = meta?.text.name;
  const types = extraCardTypes(meta?.data.type ?? 0);
  const race = meta?.data.race;
  const attribute = meta?.data.attribute;
  const desc = meta?.text.desc;
  const atk = meta?.data.atk;
  const def = meta?.data.def;

  return (
    // TODO: 宽度要好好设置 根据屏幕宽度
    <Drawer
      open={isOpen}
      placement="left"
      onClose={() => (store.isOpen = false)}
      rootClassName={styles.root}
      className={styles.drawer}
      mask={false}
      title={name}
      closeIcon={<LeftOutlined />}
      width={350}
    >
      <div className={styles.container}>
        <Space
          align="start"
          size={18}
          style={{ position: "relative", display: "flex" }}
        >
          <YgoCard
            code={meta?.id}
            width={CARD_WIDTH}
            style={{ borderRadius: 4 }}
          />
          <Space direction="vertical" className={styles.info}>
            <AtkLine
              atk={atk}
              def={types.includes(TYPE_LINK) ? undefined : def}
            />
            <CounterLine counters={counters} />
            <AttLine types={types} race={race} attribute={attribute} />
            {/* TODO: 只有怪兽卡需要展示攻击防御 */}
            {/* TODO: 展示星级/LINK数 */}
          </Space>
        </Space>
        <Divider style={{ margin: "0.875rem 0" }}></Divider>
        <Desc desc={desc} />
      </div>
    </Drawer>
  );
};

const AttLine = (props: {
  types: number[];
  race?: number;
  attribute?: number;
}) => {
  const race = props.race
    ? fetchStrings(Region.System, Race2StringCodeMap.get(props.race) || 0)
    : undefined;
  const attribute = props.attribute
    ? fetchStrings(
        Region.System,
        Attribute2StringCodeMap.get(props.attribute) || 0,
      )
    : undefined;
  const types = props.types
    .map((t) => fetchStrings(Region.System, Type2StringCodeMap.get(t) || 0))
    .join("/");
  return (
    <div className={styles.attline}>
      {attribute && <Tag>{attribute}</Tag>}
      {race && <Tag>{race}</Tag>}
      {types && <Tag>{types}</Tag>}
    </div>
  );
};

const AtkLine = (props: { atk?: number; def?: number }) => (
  <Space size={10} className={styles.atkLine} direction="vertical">
    <div>
      <div className={styles.title}>ATK</div>
      <div className={styles.number}>{props.atk ?? "?"}</div>
    </div>
    <div>
      <div className={styles.title}>DEF</div>
      <div className={styles.number}>{props.def ?? "?"}</div>
    </div>
  </Space>
);

const CounterLine = (props: { counters: { [type: number]: number } }) => {
  return (
    <Space size={10} className={styles.counterLine} direction="vertical">
      {Object.entries(props.counters).map(
        ([counterType, count], idx) =>
          count > 0 && (
            <div key={idx}>
              <div className={styles.title}>
                {fetchStrings(
                  Region.Counter,
                  `0x${Number(counterType).toString(16)}`,
                )}
              </div>
              <div className={styles.number}>{count}</div>
            </div>
          ),
      )}
    </Space>
  );
};

export const showCardModal = (
  card: Partial<Pick<typeof store, "meta" | "counters">>,
) => {
  store.isOpen = true;
  store.meta = card?.meta ?? defaultStore.meta;
  store.counters = card?.counters ?? defaultStore.counters;
};

export const closeCardModal = () => {
  store.isOpen = false;
};

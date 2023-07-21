import styles from "./index.module.scss";

import { LeftOutlined } from "@ant-design/icons";
import { Divider, Drawer, Space, Tag } from "antd";
import React from "react";
import { proxy, useSnapshot } from "valtio";

import { type CardMeta, fetchStrings } from "@/api";
import { YgoCard } from "@/ui/Shared";

import {
  Attribute2StringCodeMap,
  extraCardTypes,
  Race2StringCodeMap,
  Type2StringCodeMap,
} from "../../../../common";
import { Desc } from "./Desc";

const CARD_WIDTH = 140;

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

  const { isOpen, meta, counters: _counters } = snap;

  const name = meta?.text.name;
  const types = meta?.data.type;
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
            <AtkLine atk={atk} def={def} />
            <AttLine
              types={extraCardTypes(types || 0)}
              race={race}
              attribute={attribute}
            />
            {/* TODO: 只有怪兽卡需要展示攻击防御 */}
            {/* TODO: 展示星级/LINK数 */}
            {/* <CounterLine counters={counters} /> */}
          </Space>
        </Space>
        <Divider style={{ margin: "14px 0" }}></Divider>
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
    ? fetchStrings("!system", Race2StringCodeMap.get(props.race) || 0)
    : undefined;
  const attribute = props.attribute
    ? fetchStrings("!system", Attribute2StringCodeMap.get(props.attribute) || 0)
    : undefined;
  const types = props.types
    .map((t) => fetchStrings("!system", Type2StringCodeMap.get(t) || 0))
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

// TODO: 未完成，研究一下怎么展示这个信息
const _CounterLine = (props: { counters: { [type: number]: number } }) => {
  const counters = [];
  for (const counterType in props.counters) {
    const count = props.counters[counterType];
    if (count > 0) {
      const counterStr = fetchStrings("!counter", `0x${counterType}`);
      counters.push(`${counterStr}: ${count}`);
    }
  }

  return (
    <>
      {counters.map((counter) => (
        <div>{counter}</div>
      ))}
    </>
  );
};

export const showCardModal = (
  card: Partial<Pick<typeof store, "meta" | "counters">>
) => {
  store.isOpen = true;
  store.meta = card?.meta ?? defaultStore.meta;
  store.counters = card?.counters ?? defaultStore.counters;
};

export const closeCardModal = () => {
  store.isOpen = false;
};

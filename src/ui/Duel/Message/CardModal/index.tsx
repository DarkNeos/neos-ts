import { LeftOutlined } from "@ant-design/icons";
import { Divider, Drawer, Space, Tag } from "antd";
import classnames from "classnames";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { proxy, useSnapshot } from "valtio";

import { type CardMeta, fetchStrings, getCardDisplayName, Region } from "@/api";
import { quoteCardName, splitPendulumDescription } from "@/api/cardText";
import { isGraveInspectionBlocked } from "@/api/duelHints";
import {
  cardStore,
  type CardType,
  hasIncompleteSummon,
  matStore,
} from "@/stores";
import { registerDuelDialogReset } from "@/stores/duelDialogs";
import { fieldSelection } from "@/stores/fieldSelection";
import { YgoCard } from "@/ui/Shared";

import {
  Attribute2StringCodeMap,
  extraCardTypes,
  isPendulumMonster,
  Race2StringCodeMap,
  TYPE_LINK,
  Type2StringCodeMap,
} from "../../../../common";
import { cancelOnRightClick } from "../../cancelOnRightClick";
import { CardHints } from "../CardHints";
import { Desc } from "./Desc";
import styles from "./index.module.scss";

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
  cardUuid: null as string | null,
};

const store = proxy({ ...defaultStore });
registerDuelDialogReset(() => Object.assign(store, defaultStore));

export const CardModal = () => {
  const { t: i18n } = useTranslation("CardDetails");
  const snap = useSnapshot(store);
  const { active: selectingOnField } = useSnapshot(fieldSelection);
  const cards = useSnapshot(cardStore);
  const { cardUuid } = snap;
  const liveCard = cards.inner.find((card) => card.uuid === cardUuid);
  const duelState = useSnapshot(matStore);
  const graveBlocked = isGraveInspectionBlocked(liveCard?.location, duelState);
  useEffect(() => {
    if (graveBlocked) store.isOpen = false;
  }, [graveBlocked]);
  const summonIncomplete =
    liveCard && hasIncompleteSummon(liveCard as CardType);

  const { isOpen } = snap;
  // 优先读取对局中的实时数据，使已打开的详情同步显示改名、属性和指示物。
  const meta = liveCard?.meta ?? snap.meta;
  const text = meta.text;
  const counters = liveCard?.counters ?? snap.counters;

  // 实时 alias 只影响显示卡名，效果描述和悬停原名仍来自这张卡自身的文本。
  const { name, renamed } = getCardDisplayName(meta, liveCard?.originalData);
  const types = extraCardTypes(meta?.data.type ?? 0);
  const race = meta?.data.race;
  const attribute = meta?.data.attribute;
  const desc = isPendulumMonster(meta.data.type ?? 0)
    ? splitPendulumDescription(text.desc ?? "")
    : [text.desc];
  const atk = meta?.data.atk;
  const def = meta?.data.def;

  return (
    <Drawer
      open={isOpen && !graveBlocked}
      placement="left"
      onClose={() => (store.isOpen = false)}
      drawerRender={(node) => (
        <div
          style={{ display: "contents" }}
          onContextMenu={cancelOnRightClick(() => (store.isOpen = false))}
        >
          {node}
        </div>
      )}
      rootClassName="duel-translucent-drawer"
      className={classnames(styles.drawer, {
        [styles["field-selection"]]: selectingOnField,
      })}
      mask={false}
      title={
        <span
          className={styles.cardName}
          data-testid="duel-card-name"
          data-renamed={renamed}
          title={renamed ? `原卡名：${text.name ?? "?"}` : undefined}
        >
          {quoteCardName(text.name)}
          {renamed && <small className={styles.renamedName}>({name})</small>}
        </span>
      }
      closeIcon={<LeftOutlined />}
      width="auto"
    >
      <div
        className={styles.container}
        data-testid="duel-card-detail"
        data-card-code={meta?.id}
        data-card-alias={meta.data.alias ?? 0}
      >
        <div className={styles.summary}>
          <YgoCard code={meta?.id} width="100%" style={{ borderRadius: 4 }} />
          <div className={styles.info}>
            {!!((meta.data.type ?? 0) & 1) && (
              <AtkLine
                atk={atk}
                def={types.includes(TYPE_LINK) ? undefined : def}
              />
            )}
            <CounterLine counters={counters} />
            <AttLine types={types} race={race} attribute={attribute} />
            {/* TODO: 展示星级/LINK数 */}
          </div>
        </div>
        <Divider style={{ margin: "0.625rem 0" }}></Divider>
        {liveCard && <CardHints card={liveCard as CardType} />}
        {summonIncomplete && (
          <p
            className={styles.summonIncomplete}
            data-testid="card-summon-incomplete"
          >
            未正规登场
          </p>
        )}
        {desc.length > 1 && (
          <p className={styles.effectHeading}>
            {i18n("PendulumScale")}：← {meta.data.lscale ?? 0} -{" "}
            {meta.data.rscale ?? 0} →
          </p>
        )}
        {desc.map((effect, index) =>
          effect ? (
            <React.Fragment key={index}>
              {index > 0 && desc[0] && (
                <Divider style={{ margin: "0.625rem 0" }} />
              )}
              {desc.length > 1 && (
                <p className={styles.effectHeading}>
                  {i18n(index ? "MonsterEffect" : "PendulumEffect")}
                </p>
              )}
              <Desc desc={effect} />
            </React.Fragment>
          ) : null,
        )}
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
      {(attribute || race) && (
        <div className={styles.attributeRow}>
          {attribute && <Tag>{attribute}</Tag>}
          {race && <Tag>{race}</Tag>}
        </div>
      )}
      {types && <Tag>{types}</Tag>}
    </div>
  );
};

const AtkLine = (props: { atk?: number; def?: number }) => (
  <Space
    size={10}
    className={styles.atkLine}
    direction="vertical"
    data-testid="duel-card-stats"
  >
    <div
      data-testid="duel-card-stat"
      data-stat="ATK"
      data-stat-value={props.atk ?? ""}
    >
      <div className={styles.title}>ATK</div>
      <div className={styles.number}>{props.atk ?? "?"}</div>
    </div>
    <div
      data-testid="duel-card-stat"
      data-stat="DEF"
      data-stat-value={props.def ?? ""}
    >
      <div className={styles.title}>DEF</div>
      <div className={styles.number}>{props.def ?? "?"}</div>
    </div>
  </Space>
);

const CounterLine = (props: { counters: { [type: number]: number } }) => {
  if (!Object.values(props.counters).some((count) => count > 0)) return null;

  return (
    <Space size={10} className={styles.counterLine} direction="vertical">
      {Object.entries(props.counters).map(
        ([counterType, count], idx) =>
          count > 0 && (
            <div
              key={idx}
              data-testid="duel-card-counter"
              data-counter-type={counterType}
              data-counter-count={count}
            >
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

/** 使用候选元数据预览；通过位置查找实时卡片时，需确认卡号一致。 */
export const showCardModal = (
  card: Partial<Pick<typeof store, "meta" | "counters">> & {
    uuid?: string;
    location?: Parameters<typeof cardStore.find>[0];
  },
) => {
  if (isGraveInspectionBlocked(card.location, matStore)) return;
  store.isOpen = true;
  store.meta = card?.meta ?? defaultStore.meta;
  store.counters = card?.counters ?? defaultStore.counters;
  // 选卡窗口可公开牌堆卡号，场上同一位置的数据可能仍是未知卡或旧卡。
  const target = card.location ? cardStore.find(card.location) : undefined;
  store.cardUuid =
    card.uuid ??
    (target?.meta.id === card.meta?.id ? target?.uuid : undefined) ??
    null;
};

export const closeCardModal = () => {
  store.isOpen = false;
};

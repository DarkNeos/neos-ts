import { fetchStrings, getCardDisplayName, Region, ygopro } from "@/api";
import {
  Attribute2StringCodeMap,
  Race2StringCodeMap,
  TYPE_CONTINUOUS,
  TYPE_COUNTER,
  TYPE_EQUIP,
  TYPE_FIELD,
  TYPE_LINK,
  TYPE_PENDULUM,
  TYPE_QUICKPLAY,
  TYPE_RITUAL,
  TYPE_SPELL,
  TYPE_TRAP,
  TYPE_TUNER,
} from "@/common";
import { type CardType } from "@/stores";
import { fieldInspection } from "@/stores/fieldInspection";

import { faceupField, linkDirections } from "../fieldGeometry";
import { useFieldRelations } from "../FieldRelationsProvider";
import styles from "./index.module.scss";

const changed = (value: number | undefined, original: number | undefined) =>
  value !== undefined && original !== undefined && value !== original;
const attributeGlyphs = ["地", "水", "炎", "风", "光", "暗", "神"];
const races = [
  "战士",
  "魔法师",
  "天使",
  "恶魔",
  "不死",
  "机械",
  "水",
  "炎",
  "岩石",
  "鸟兽",
  "植物",
  "昆虫",
  "雷",
  "龙",
  "兽",
  "兽战士",
  "恐龙",
  "鱼",
  "海龙",
  "爬虫类",
  "念动力",
  "幻神兽",
  "创造神",
  "幻龙",
  "电子界",
  "幻想魔",
];
const raceLabel = (mask: number) =>
  races.filter((_, i) => mask & (2 ** i)).join(" / ");
const raceName = (mask: number) => {
  const name = fetchStrings(Region.System, Race2StringCodeMap.get(mask) ?? -1);
  return name && name !== "?" ? name : raceLabel(mask);
};

export const FieldSigns = ({ card }: { card: CardType }) => {
  const data = card.meta.data,
    original = card.originalData;
  const monster = card.location.zone === ygopro.CardZone.MZONE;
  const type = data.type ?? 0;
  const scaleSide = [0, 6].includes(card.location.sequence) ? "left" : "right";
  const pendulum =
    !monster &&
    !!(type & TYPE_PENDULUM) &&
    !card.equipTarget &&
    !(type & (TYPE_EQUIP | TYPE_CONTINUOUS | TYPE_TRAP)) &&
    [0, 4, 6, 7].includes(card.location.sequence);
  const scale = scaleSide === "left" ? data.lscale : data.rscale;
  const originalScale =
    scaleSide === "left" ? original?.lscale : original?.rscale;
  const magicKind =
    type & TYPE_COUNTER
      ? "counter-trap"
      : type & TYPE_FIELD
      ? "field"
      : type & TYPE_EQUIP
      ? "equip"
      : type & TYPE_CONTINUOUS
      ? "continuous"
      : type & TYPE_QUICKPLAY
      ? "quickplay"
      : type & TYPE_RITUAL
      ? "ritual"
      : type & TYPE_TRAP
      ? "trap"
      : "spell";
  return (
    <>
      <div className={styles["field-signs"]}>
        {monster &&
          attributeGlyphs.map((glyph, i) =>
            (data.attribute ?? 0) & (2 ** i) ? (
              <span
                key={glyph}
                className={styles["attribute-sign"]}
                data-testid="field-card-attribute"
                data-attribute={2 ** i}
                data-changed={changed(data.attribute, original?.attribute)}
                title={`${
                  fetchStrings(
                    Region.System,
                    Attribute2StringCodeMap.get(2 ** i)!,
                  ) || glyph
                }${
                  changed(data.attribute, original?.attribute)
                    ? "（已变化）"
                    : ""
                }`}
              >
                {glyph}
              </span>
            ) : null,
          )}
        {monster && changed(data.race, original?.race) && (
          <span
            data-testid="field-card-race"
            data-race={data.race}
            data-changed="true"
            title={`种族已变化：${raceName(data.race!)}`}
          >
            <SignIcon kind="race" />
          </span>
        )}
        {monster && !!(type & TYPE_TUNER) && (
          <span
            data-testid="field-card-tuner"
            data-changed={
              original?.type !== undefined && !(original.type & TYPE_TUNER)
            }
            title="调整"
          >
            <SignIcon kind="tuner" />
          </span>
        )}
        {!monster && !!(type & (TYPE_SPELL | TYPE_TRAP)) && (
          <span
            data-testid="field-card-spell-type"
            data-kind={magicKind}
            title={magicTitles[magicKind]}
          >
            <SignIcon kind={magicKind} />
          </span>
        )}
      </div>
      <RelationshipSigns card={card} />
      {pendulum && (
        <span
          className={styles["pendulum-scale"]}
          data-testid="field-card-scale"
          data-side={scaleSide}
          data-change={
            scale === undefined ||
            originalScale === undefined ||
            scale === originalScale
              ? "normal"
              : scale > originalScale
              ? "up"
              : "down"
          }
          title={`${scaleSide === "left" ? "左" : "右"}灵摆刻度`}
        >
          <SignIcon kind="pendulum" />
          {scale ?? "?"}
        </span>
      )}
    </>
  );
};

const RelationshipSigns = ({ card }: { card: CardType }) => {
  const { relations: allRelations, inspected, pinned } = useFieldRelations();
  const relations = allRelations.filter(
    ({ source, target }) =>
      source.uuid === card.uuid || target.uuid === card.uuid,
  );
  if (!relations.length) return null;
  return (
    <div className={styles["relation-signs"]}>
      {relations.map(({ source, target, kind, number }) => {
        const outgoing = source.uuid === card.uuid;
        const role =
          kind === "chain"
            ? outgoing
              ? "连锁发动卡"
              : "连锁对象"
            : kind === "equip"
            ? outgoing
              ? "装备卡"
              : "被装备卡"
            : outgoing
            ? "效果来源"
            : "持续效果对象";
        // 关联双方分别读取实时 alias，效果改名后的名称与各自详情一致。
        const sourceName = getCardDisplayName(
          source.meta,
          source.originalData,
        ).name;
        const targetName = getCardDisplayName(
          target.meta,
          target.originalData,
        ).name;
        const label = `${role} · ${number}：${sourceName ?? "?"} → ${
          target.code ? targetName ?? "?" : "盖卡"
        }`;
        return (
          <button
            key={`${source.uuid}-${target.uuid}-${kind}-${number}`}
            type="button"
            data-testid={`field-card-${kind}-relation`}
            data-kind={kind}
            data-role={outgoing ? "source" : "target"}
            data-relation-number={number}
            data-source={source.uuid}
            data-target={target.uuid}
            data-active={source.uuid === inspected || target.uuid === inspected}
            aria-label={label}
            title={label}
            aria-pressed={pinned === card.uuid}
            onFocus={() => {
              fieldInspection.hovered = card.uuid;
            }}
            onBlur={() => {
              if (fieldInspection.hovered === card.uuid)
                fieldInspection.hovered = null;
            }}
            onClick={(event) => {
              event.stopPropagation();
              fieldInspection.pinned = pinned === card.uuid ? null : card.uuid;
            }}
          >
            <SignIcon kind={kind} />
            <span>{number}</span>
            <svg
              className={styles["relation-direction"]}
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path
                d={outgoing ? "M2 13 12 3M5 3h7v7" : "M13 2 3 12M3 5v7h7"}
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
};

export const LinkArrows = ({ card }: { card: CardType }) => {
  if (
    !faceupField(card) ||
    card.location.zone !== ygopro.CardZone.MZONE ||
    !((card.meta.data.type ?? 0) & TYPE_LINK)
  )
    return null;
  const mask =
    card.meta.data.linkMarkers ??
    card.originalData?.linkMarkers ??
    card.meta.data.def ??
    0;
  return (
    <svg
      className={styles["link-arrows"]}
      viewBox="0 0 100 140"
      aria-label="Link 方向箭头"
      data-testid="field-card-link-arrows"
    >
      {linkDirections
        .filter(({ bit }) => mask & bit)
        .map(({ bit, dx, dy, angle }) => (
          <path
            key={bit}
            data-direction={bit}
            d="M-6 5 0-5 6 5 0 2Z"
            transform={`translate(${50 + dx * 43} ${
              70 + dy * 61
            }) rotate(${angle})`}
          />
        ))}
    </svg>
  );
};

const magicTitles: Record<string, string> = {
  "counter-trap": "反击陷阱",
  field: "场地魔法",
  equip: "装备",
  continuous: "永续",
  quickplay: "速攻魔法",
  ritual: "仪式魔法",
  trap: "通常陷阱",
  spell: "通常魔法",
};
const signPaths: Record<string, string> = {
  race: "M7 3c0 9 10 9 10 18M17 3c0 9-10 9-10 18M8 5h8M9 9h6M9 15h6M8 19h8",
  tuner: "M7 3v7a5 5 0 0 0 10 0V3M12 15v6M9 21h6",
  equip: "m4 20 6-6M7 12l5 5M10 14l9-11 2 2-9 11",
  continuous: "M12 12C4-1-3 18 6 18c6 0 6-12 12-12 9 0 2 19-6 6Z",
  quickplay: "m14 2-9 12h7l-2 8 9-12h-7Z",
  field: "m3 8 9-5 9 5v10l-9 4-9-4ZM3 8l9 5 9-5M12 13v9",
  "counter-trap": "M20 6H9V2L3 9l6 7v-4h6v9h5Z",
  ritual: "M5 4h14l-2 10-5 3-5-3ZM12 17v4M8 21h8",
  trap: "M3 20 12 3l9 17ZM12 9v5M12 17v1",
  spell: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z",
  pendulum: "M12 2v11m0-5-7 10 7 4 7-4-7-10Z",
  target:
    "M9 3H3v6M15 3h6v6M3 15v6h6M15 21h6v-6M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z",
  chain:
    "m9 15 6-6M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0",
};
const SignIcon = ({ kind }: { kind: string }) => (
  <svg viewBox="0 0 24 24" className={styles["stat-icon"]} aria-hidden="true">
    <path
      d={signPaths[kind]}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

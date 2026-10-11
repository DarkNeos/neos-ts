import { useSnapshot } from "valtio";

import { fetchStrings, Region, ygopro } from "@/api";
import { TYPE_LINK, TYPE_MONSTER, TYPE_XYZ } from "@/common";
import { cardStore, type CardType, isMe } from "@/stores";

import { FieldSigns } from "./FieldSigns";
import styles from "./index.module.scss";

const change = (value?: number, original?: number) =>
  value === undefined || original === undefined || value === original
    ? "normal"
    : value > original
    ? "up"
    : "down";
const valueText = (value?: number) =>
  value === undefined || value < 0 ? "?" : value;

export const FieldCardInfo = ({ card }: { card: CardType }) => {
  const { location, meta, originalData, counters } = card;
  const { MZONE, SZONE } = ygopro.CardZone;
  const { FACEUP, FACEUP_ATTACK, FACEUP_DEFENSE } = ygopro.CardPosition;
  if (
    ![MZONE, SZONE].includes(location.zone) ||
    location.is_overlay ||
    ![FACEUP, FACEUP_ATTACK, FACEUP_DEFENSE].includes(location.position)
  )
    return null;
  const data = meta.data;
  const monster =
    location.zone === MZONE && !!((data.type ?? 0) & TYPE_MONSTER);
  const link = !!((data.type ?? 0) & TYPE_LINK);
  const xyz = !!((data.type ?? 0) & TYPE_XYZ);
  const level = link
    ? data.link ?? data.level
    : xyz
    ? data.rank ?? data.level
    : data.level;
  const originalLevel = link
    ? originalData?.link ?? originalData?.level
    : xyz
    ? originalData?.rank ?? originalData?.level
    : originalData?.level;
  const counterEntries = Object.entries(counters).filter(
    ([, count]) => count > 0,
  );
  return (
    <div
      className={styles["field-info"]}
      data-testid="field-card-info"
      data-opponent={!isMe(location.controller)}
    >
      <FieldSigns card={card} />
      <div className={styles["field-badges"]}>
        {monster && (
          <span
            data-testid="field-card-level"
            data-change={change(level, originalLevel)}
            title={link ? "Link 值" : xyz ? "阶级" : "等级"}
          >
            <StatIcon kind={link ? "link" : xyz ? "rank" : "level"} />
            {valueText(level)}
          </span>
        )}
        {monster && xyz && <MaterialCount location={location} />}
        {card.hint?.type === 1 && (
          <span data-testid="field-card-turn-counter" title="回合计数">
            <StatIcon kind="counter" />
            {card.hint.value}
          </span>
        )}
        {counterEntries.map(([type, count]) => (
          <span
            key={type}
            className={styles["field-counter"]}
            data-testid="field-card-counter"
            data-counter-type={type}
            title={
              fetchStrings(Region.Counter, `0x${Number(type).toString(16)}`) ||
              `指示物 ${type}`
            }
          >
            <StatIcon kind="counter" />
            {count}
          </span>
        ))}
      </div>
      {monster && (
        <div className={styles["field-stats"]}>
          <span
            data-testid="field-card-atk"
            data-change={change(data.atk, originalData?.atk)}
            data-emphasis={location.position === FACEUP_ATTACK}
            title="攻击力"
          >
            {valueText(data.atk)}
          </span>
          {!link && (
            <>
              <span className={styles["stat-separator"]} aria-hidden="true">
                /
              </span>
              <span
                data-testid="field-card-def"
                data-change={change(data.def, originalData?.def)}
                data-emphasis={location.position === FACEUP_DEFENSE}
                title="防御力"
              >
                {valueText(data.def)}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const MaterialCount = ({ location }: { location: ygopro.CardLocation }) => {
  // 素材增减不会修改宿主卡片，需要订阅素材本身的位置变化。
  const { inner } = useSnapshot(cardStore);
  const count = inner.filter(
    (card) =>
      card.location.is_overlay &&
      card.location.zone === location.zone &&
      card.location.controller === location.controller &&
      card.location.sequence === location.sequence,
  ).length;
  return (
    <span data-testid="field-card-materials" title="超量素材">
      <StatIcon kind="materials" />
      {count}
    </span>
  );
};

const StatIcon = ({
  kind,
}: {
  kind: "level" | "rank" | "link" | "counter" | "materials";
}) => (
  <svg
    className={styles["stat-icon"]}
    data-icon={kind}
    viewBox="0 0 24 24"
    role="img"
    aria-label={
      {
        level: "等级",
        rank: "阶级",
        link: "Link 值",
        counter: "指示物",
        materials: "超量素材",
      }[kind]
    }
  >
    {kind === "materials" ? (
      <>
        <path
          d="m3 14 9-5 9 5-9 6Z"
          fill="#776326"
          stroke="#ffe393"
          strokeWidth="1.5"
        />
        <path
          d="m3 9 9-5 9 5-9 6Z"
          fill="#253346"
          stroke="#ffe393"
          strokeWidth="1.5"
        />
      </>
    ) : kind === "link" ? (
      <>
        <path
          d="M6 2h12l5 10-5 10H6L1 12Z"
          fill="#126eab"
          stroke="#69ccff"
          strokeWidth="1.5"
        />
        <path d="m8 6-3 6 3 6h8l3-6-3-6Z" fill="none" stroke="#70c8ff" />
        <path d="M8 10h8M8 14h8" stroke="#071e40" strokeWidth="2" />
      </>
    ) : kind === "counter" ? (
      <>
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="#192535"
          stroke="#e5c76a"
          strokeWidth="2"
        />
        <path d="m12 5 3 7-3 7-3-7Z" fill="#efd987" />
        <circle cx="5" cy="12" r="1.5" fill="#efd987" />
        <circle cx="19" cy="12" r="1.5" fill="#efd987" />
      </>
    ) : (
      <>
        <circle
          cx="12"
          cy="12"
          r="10"
          fill={kind === "level" ? "#a5462b" : "#171e2a"}
          stroke="#efd68a"
          strokeWidth="1.5"
        />
        <path
          d="m12 3 2.6 5.7 6.2.7-4.6 4.3 1.3 6.1L12 16.7l-5.5 3.1 1.3-6.1-4.6-4.3 6.2-.7Z"
          fill="#ffe16b"
          stroke="#8e6620"
          strokeWidth=".6"
        />
      </>
    )}
  </svg>
);

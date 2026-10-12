import { type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useSnapshot } from "valtio";

import { fetchCard, ygopro } from "@/api";
import { duelAnimation, presentationDuration } from "@/infra/duelAnimation";
import { cardStore, type CardType, matStore } from "@/stores";
import { ChainIcon, YgoCard } from "@/ui/Shared";

import { showCardModal } from "../../Message/CardModal";
import { faceupField } from "../fieldGeometry";
import styles from "./index.module.scss";

export const ChainCards = () => {
  const { chainCards, selfType } = useSnapshot(matStore);
  if (!chainCards.length) return null;

  return createPortal(
    <aside
      className={styles.panel}
      aria-label="当前连锁"
      data-testid="duel-chain-cards"
    >
      <div className={styles.heading}>当前连锁 · {chainCards.length}</div>
      <ol className={styles.cards}>
        {chainCards.map((entry, index) => {
          const meta = fetchCard(entry.code);
          const firstPlayer =
            selfType !== ygopro.StocTypeChange.SelfType.PLAYER2;
          const isMe = (entry.controller % 2 === 0) === firstPlayer;
          const name = meta.text.name || `卡片 ${entry.code}`;
          const status = entry.negated
            ? entry.negated === "activation"
              ? "发动无效"
              : "效果无效"
            : entry.solved
            ? "已处理"
            : entry.resolving
            ? "处理中"
            : "待处理";
          return (
            <li key={index}>
              <button
                type="button"
                className={styles.card}
                data-testid="duel-chain-card"
                data-chain-index={index + 1}
                data-card-code={entry.code}
                data-solved={entry.solved}
                data-building={entry.building ?? false}
                data-resolving={entry.resolving ?? false}
                style={
                  {
                    "--chain-flash-duration": `${presentationDuration(
                      duelAnimation.chain.built,
                    )}ms`,
                  } as CSSProperties
                }
                data-negated={entry.negated}
                data-controller={isMe ? "me" : "op"}
                aria-label={`连锁 ${index + 1}：${name}，${status}`}
                onClick={() => {
                  const card = cardStore.inner.find(
                    (card) =>
                      card.uuid === entry.cardUuid && card.code === entry.code,
                  );
                  showCardModal(card ?? { meta });
                }}
              >
                <span className={styles.thumbnail}>
                  <YgoCard code={entry.code} />
                  <ChainIcon className={styles.badge} index={index + 1} />
                </span>
                <span className={styles.info}>
                  <strong>连锁 {index + 1}</strong>
                  <span>{isMe ? "我方" : "对方"}</span>
                  <span className={styles.name}>{name}</span>
                  <span className={styles.status}>{status}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>,
    document.body,
  );
};

/** 发动卡和对象各自保留编号，未知盖卡的标记只包含公开的连锁编号。 */
export const CardChainMarkers = ({
  card,
  focusing,
}: {
  card: CardType;
  focusing: boolean;
}) => {
  const { chainCards } = useSnapshot(matStore);
  const { inner } = useSnapshot(cardStore);
  const { location } = card;
  const { HAND, MZONE, SZONE, GRAVE, REMOVED } = ygopro.CardZone;
  if (
    location.is_overlay ||
    ![HAND, MZONE, SZONE, GRAVE, REMOVED].includes(location.zone)
  )
    return null;
  if (
    !focusing &&
    [GRAVE, REMOVED].includes(location.zone) &&
    inner.some(
      (other) =>
        !other.location.is_overlay &&
        other.location.zone === location.zone &&
        other.location.controller === location.controller &&
        other.location.sequence > location.sequence,
    )
  )
    return null;

  return (
    <>
      {chainCards.map(
        (entry, index) =>
          entry.cardUuid === card.uuid &&
          entry.code === card.code && (
            <ChainIcon
              key={index}
              index={index + 1}
              data-testid="duel-chain-marker"
              data-chain-index={index + 1}
              data-card-uuid={card.uuid}
              data-card-code={entry.code}
              data-chain-controller={location.controller}
              data-chain-zone={ygopro.CardZone[location.zone]}
              data-chain-sequence={location.sequence}
              data-solved={entry.solved}
              data-building={entry.building ?? false}
              data-resolving={entry.resolving ?? false}
              className={styles.marker}
              style={
                {
                  "--chain-flash-duration": `${presentationDuration(
                    duelAnimation.chain.built,
                  )}ms`,
                } as CSSProperties
              }
              data-negated={entry.negated}
              title={
                entry.negated
                  ? entry.negated === "activation"
                    ? "发动无效"
                    : "效果无效"
                  : undefined
              }
            />
          ),
      )}
      {!faceupField(card) &&
        chainCards.map((entry, index) =>
          entry.targets?.includes(card.uuid) ? (
            <span
              key={`target-${index}`}
              className={styles.target}
              data-testid="field-card-chain-relation"
              data-role="target"
              data-relation-number={index + 1}
              title={`连锁 ${index + 1} 对象`}
            >
              <span aria-hidden="true">◎</span>
              {index + 1}
            </span>
          ) : null,
        )}
    </>
  );
};

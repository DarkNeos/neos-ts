import { useSnapshot } from "valtio";

import { fetchCard } from "@/api";
import { cardHintText, descriptionHintText } from "@/api/duelHints";
import {
  type CardType,
  hasCompleteSummon,
  hasIncompleteSummon,
  matStore,
} from "@/stores";

import styles from "./index.module.scss";

export const CardHints = ({
  card,
  showSummonStatus = false,
}: {
  card: CardType;
  showSummonStatus?: boolean;
}) => {
  const { chainCards } = useSnapshot(matStore);
  if (!card.code) return null;
  return (
    <div className={styles.hints} data-testid="card-hints">
      {showSummonStatus &&
        (hasCompleteSummon(card) || hasIncompleteSummon(card)) && (
          <span
            data-testid="card-summon-status"
            data-complete={hasCompleteSummon(card)}
          >
            {hasCompleteSummon(card) ? "已正规召唤" : "未正规登场"}
          </span>
        )}
      {card.hint && (
        <span data-testid="card-current-hint">{cardHintText(card.hint)}</span>
      )}
      {Object.keys(card.descriptionHints ?? {}).map((value) => (
        <span key={value} data-testid="card-description-hint">
          {descriptionHintText(Number(value))}
        </span>
      ))}
      {chainCards.map((entry, index) => {
        const source = entry.cardUuid === card.uuid;
        const targeted = entry.targets?.includes(card.uuid);
        if (!source && !targeted) return null;
        return (
          <span
            key={index}
            data-testid="card-chain-info"
            data-chain-index={index + 1}
          >
            {source ? `连锁 ${index + 1} 发动` : `连锁 ${index + 1} 对象`}
            {targeted && !source
              ? ` · ${fetchCard(entry.code).text.name || entry.code}`
              : ""}
            {entry.negated &&
              ` · ${entry.negated === "activation" ? "发动无效" : "效果无效"}`}
          </span>
        );
      })}
    </div>
  );
};

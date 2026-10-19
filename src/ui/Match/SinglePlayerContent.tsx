import { Select } from "antd";
import { useTranslation } from "react-i18next";

import { type AIBot, aiBots } from "@/config/aiBots";
import { YgoCard } from "@/ui/Shared";

import styles from "./SinglePlayerContent.module.scss";

export const SinglePlayerContent: React.FC<{
  selected?: AIBot;
  disabled: boolean;
  onChange: (bot?: AIBot) => void;
}> = ({ selected, disabled, onChange }) => {
  const { t } = useTranslation("Match");
  return (
    <div className={styles.content}>
      <label htmlFor="single-player-ai">{t("AIOpponent")}</label>
      <Select
        id="single-player-ai"
        data-testid="single-player-ai-select"
        aria-label={t("AIOpponent")}
        showSearch
        optionFilterProp="label"
        disabled={disabled}
        value={selected?.deck ?? ""}
        onChange={(deck) => onChange(aiBots.find((bot) => bot.deck === deck))}
        options={[
          { value: "", label: t("RandomAI") },
          ...aiBots.map((bot) => ({
            value: bot.deck,
            label: `${bot.name} · ${bot.label} (${bot.deck})`,
          })),
        ]}
        notFoundContent={t("AINotFound")}
      />
      {selected ? (
        <div
          key={selected.deck}
          className={styles.preview}
          data-testid="single-player-deck-preview"
          aria-label={t("AIDeckPreview")}
        >
          <div className={styles.heading}>
            <strong>{selected.label}</strong>
            <span>{t("AIDeckPreview")}</span>
          </div>
          <div className={styles.zones}>
            {(["main", "extra", "side"] as const).map((zone) => {
              const cards = selected[zone];
              if (zone === "side" && !cards.length) return null;
              return (
                <section key={zone} data-testid={`single-player-deck-${zone}`}>
                  <h4>
                    {t(`AIDeckZone_${zone}`)} · {cards.length}
                  </h4>
                  <div className={styles.cards}>
                    {cards.map((code, index) => (
                      <div
                        key={`${code}-${index}`}
                        title={String(code)}
                        aria-label={t("AIPreviewCard", { code })}
                        data-card-code={code}
                        className={styles.card}
                      >
                        <span>{code}</span>
                        <YgoCard code={code} loading="lazy" />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          <p className={styles.note}>{t("AIDeckPreviewNote")}</p>
        </div>
      ) : (
        <p className={styles.note}>{t("RandomAIHint")}</p>
      )}
      <p className={styles.note}>{t("AIChooseServer")}</p>
    </div>
  );
};

import { Button, Descriptions, type DescriptionsProps } from "antd";
import classNames from "classnames";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { type CardMeta, fetchCard, fetchStrings, Region } from "@/api";
import { splitPendulumDescription } from "@/api/cardText";
import {
  Attribute2StringCodeMap,
  extraCardTypes,
  isLinkMonster,
  isMonster,
  isPendulumMonster,
  Race2StringCodeMap,
  Type2StringCodeMap,
} from "@/common";
import { CardEffectText, IconFont, ScrollableArea, YgoCard } from "@/ui/Shared";

import styles from "./index.module.scss";

export const CardDetail: React.FC<{
  code: number;
  open: boolean;
  onClose: () => void;
}> = ({ code, open, onClose }) => {
  const { t: i18n } = useTranslation("CardDetails");
  const [card, setCard] = useState<CardMeta>();
  const text = card?.text ?? {};
  useEffect(() => {
    setCard(fetchCard(code));
  }, [code]);
  const cardType = useMemo(
    () =>
      extraCardTypes(card?.data.type ?? 0)
        .map((t) => fetchStrings(Region.System, Type2StringCodeMap.get(t) || 0))
        .join(" / "),
    [card?.data.type],
  );
  const desc = useMemo(
    () =>
      isPendulumMonster(card?.data.type ?? 0)
        ? splitPendulumDescription(text.desc ?? "")
        : [text.desc],
    [text.desc, card?.data.type],
  );

  const items = useMemo(() => {
    const result: DescriptionsProps["items"] = [];
    if (card?.data.level) {
      result.push({
        label: i18n("Level"),
        children: card?.data.level,
      });
    }

    result.push({
      label: i18n("Type"),
      children: cardType,
      span: 2,
    });

    if (card?.data.attribute) {
      result.push({
        label: i18n("Attribute"),
        children: fetchStrings(
          Region.System,
          Attribute2StringCodeMap.get(card?.data.attribute ?? 0) || 0,
        ),
      });
    }

    if (card?.data.race) {
      result.push({
        label: i18n("Race"),
        children: fetchStrings(
          Region.System,
          Race2StringCodeMap.get(card?.data.race ?? 0) || 0,
        ),
        span: 2,
      });
    }

    if (isMonster(card?.data.type ?? 0)) {
      result.push({
        label: i18n("Attack"),
        children: card?.data.atk,
      });

      if (!isLinkMonster(card?.data.type ?? 0)) {
        result.push({
          label: i18n("Defence"),
          children: card?.data.def,
        });
      }

      if (card?.data.lscale) {
        result.push({
          label: i18n("PendulumScale"),
          children: (
            <>
              ← {card.data.lscale} - {card.data.rscale} →
            </>
          ),
        });
      }
    }
    return result;
  }, [card]);

  return (
    <div
      className={classNames(styles.detail, { [styles.open]: open })}
      data-testid="deck-card-detail"
      data-card-code={code}
    >
      <div className={styles.container}>
        <Button
          className={styles["btn-close"]}
          icon={<IconFont type="icon-side-bar-fill" size={16} />}
          type="text"
          onClick={onClose}
        />
        <a href={`https://ygocdb.com/card/${code}`} target="_blank">
          <YgoCard className={styles.card} code={code} />
        </a>
        <div className={styles.title}>
          <span data-testid="deck-card-detail-name">{text.name}</span>
        </div>
        <ScrollableArea>
          <Descriptions layout="vertical" size="small" items={items} />
          <Descriptions
            layout="vertical"
            size="small"
            items={
              // 保留段落原始索引，缺少灵摆效果时仍正确标注怪兽效果。
              desc.flatMap((d, i) =>
                d
                  ? [
                      {
                        label:
                          desc.length > 1
                            ? i
                              ? i18n("MonsterEffect")
                              : i18n("PendulumEffect")
                            : i18n("CardEffect"),
                        span: 3,
                        children: <CardEffectText desc={d} />,
                      },
                    ]
                  : [],
              )
            }
          ></Descriptions>
        </ScrollableArea>
      </div>
    </div>
  );
};

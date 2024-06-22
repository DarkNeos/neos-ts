import { Button, Descriptions, type DescriptionsProps } from "antd";
import classNames from "classnames";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { type CardMeta, fetchCard, fetchStrings, Region } from "@/api";
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
        ? processPendulumString(card?.text.desc ?? "")
        : [card?.text.desc],
    [card?.text.desc],
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
    <div className={classNames(styles.detail, { [styles.open]: open })}>
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
          <span>{card?.text.name}</span>
        </div>
        <ScrollableArea>
          <Descriptions layout="vertical" size="small" items={items} />
          <Descriptions
            layout="vertical"
            size="small"
            items={desc.filter(Boolean).map((d, i) => ({
              label:
                desc.length > 1
                  ? i
                    ? i18n("MonsterEffect")
                    : i18n("PendulumEffect")
                  : i18n("CardEffect"),
              span: 3,
              children: <CardEffectText desc={d} />,
            }))}
          ></Descriptions>
        </ScrollableArea>
      </div>
    </div>
  );
};

function processPendulumString(input: string): string[] {
  // 删除形如“← ... →”的结构
  const withoutArrows = input.replace(/←.*?→/g, "");

  // 以 "【怪兽效果】" 作为分隔符切割字符串
  const splitStrings = withoutArrows.split("【怪兽效果】");

  // 返回切割后的字符串列表
  return splitStrings.map((s) => s.trim());
}

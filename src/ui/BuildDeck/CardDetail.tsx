import { Button, Descriptions } from "antd";
import classNames from "classnames";
import { useEffect, useMemo, useState } from "react";

import { type CardMeta, fetchCard, fetchStrings, Region } from "@/api";
import {
  Attribute2StringCodeMap,
  extraCardTypes,
  isLinkMonster,
  isMonster,
  Race2StringCodeMap,
  Type2StringCodeMap,
} from "@/common";
import { CardEffectText, IconFont, ScrollableArea, YgoCard } from "@/ui/Shared";

import styles from "./CardDetail.module.scss";

export const CardDetail: React.FC<{
  code: number;
  open: boolean;
  onClose: () => void;
}> = ({ code, open, onClose }) => {
  const [card, setCard] = useState<CardMeta>();
  useEffect(() => {
    fetchCard(code).then(setCard);
  }, [code]);
  const cardType = useMemo(
    () =>
      extraCardTypes(card?.data.type ?? 0)
        .map((t) => fetchStrings(Region.System, Type2StringCodeMap.get(t) || 0))
        .join(" / "),
    [card?.data.type],
  );
  return (
    <div className={classNames(styles.detail, { [styles.open]: open })}>
      <div className={styles.container}>
        <Button
          className={styles["btn-close"]}
          icon={<IconFont type="icon-side-bar-fill" size={16} />}
          type="text"
          onClick={onClose}
        />
        <YgoCard className={styles.card} code={code} />
        <div className={styles.title}>
          <span>{card?.text.name}</span>
          {/* <Avatar size={22}>光</Avatar> */}
        </div>
        <ScrollableArea>
          <Descriptions layout="vertical" size="small">
            {card?.data.level && (
              <Descriptions.Item label="等级">
                {card?.data.level}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="类型" span={2}>
              {cardType}
            </Descriptions.Item>
            {card?.data.attribute && (
              <Descriptions.Item label="属性">
                {fetchStrings(
                  Region.System,
                  Attribute2StringCodeMap.get(card?.data.attribute ?? 0) || 0,
                )}
              </Descriptions.Item>
            )}
            {card?.data.race && (
              <Descriptions.Item label="种族" span={2}>
                {fetchStrings(
                  Region.System,
                  Race2StringCodeMap.get(card?.data.race ?? 0) || 0,
                )}
              </Descriptions.Item>
            )}

            {isMonster(card?.data.type ?? 0) && (
              <>
                <Descriptions.Item label="攻击力">2000</Descriptions.Item>
                {!isLinkMonster(card?.data.type ?? 0) && (
                  <Descriptions.Item label="守备力">0</Descriptions.Item>
                )}
                {card?.data.lscale && (
                  <Descriptions.Item label="灵摆刻度">
                    ← {card.data.lscale} - {card.data.rscale} →
                  </Descriptions.Item>
                )}
              </>
            )}
          </Descriptions>
          <Descriptions layout="vertical" size="small">
            <Descriptions.Item label="卡片效果" span={3}>
              <CardEffectText desc={card?.text.desc} />
            </Descriptions.Item>
          </Descriptions>
        </ScrollableArea>
      </div>
    </div>
  );
};

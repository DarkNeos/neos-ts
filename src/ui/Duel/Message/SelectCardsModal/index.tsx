import "./index.scss";

import { CheckCard } from "@ant-design/pro-components";
import { Button, Segmented, Space, Tooltip } from "antd";
import { type FC, useEffect, useState } from "react";
import { INTERNAL_Snapshot as Snapshot, useSnapshot } from "valtio";

import type { CardMeta, ygopro } from "@/api";
import { fetchStrings } from "@/api";
import { matStore } from "@/stores";
import { YgoCard } from "@/ui/Shared";

import { groupBy } from "../../utils";
import { showCardModal } from "../CardModal";
import { NeosModal } from "../NeosModal";

export const SelectCardsModal: FC<{
  isOpen: boolean;
  isChain: boolean;
  min: number;
  max: number;
  single: boolean;
  selecteds: Snapshot<Option[]>; // 已经选择了的卡
  selectables: Snapshot<Option[]>; // 最多选择多少卡
  mustSelects: Snapshot<Option[]>; // 单选
  cancelable: boolean; // 能否取消
  finishable: boolean; // 选择足够了之后，能否确认
  totalLevels: number; // 需要的总等级数（用于同调/仪式/...）
  overflow: boolean; // 选择等级时候，是否可以溢出
  onSubmit: (options: Snapshot<Option[]>) => void;
  onCancel: () => void;
  onFinish: () => void;
}> = ({
  isOpen,
  isChain,
  min,
  max,
  single,
  selecteds,
  selectables,
  mustSelects,
  cancelable,
  finishable,
  totalLevels,
  overflow,
  onSubmit,
  onCancel,
  onFinish,
}) => {
  const [result, setResult] = useState<Option[]>([]);
  const [submitable, setSubmitable] = useState(false);

  const hint = useSnapshot(matStore.hint);
  const preHintMsg = hint?.esHint || "";
  const selectHintMsg = hint?.esSelectHint || "请选择卡片";

  const minMaxText = min === max ? min : `${min}-${max}`;

  // 判断是否可以提交
  useEffect(() => {
    const [sumLevel1, sumLevel2] = (["level1", "level2"] as const).map((key) =>
      [...mustSelects, ...result]
        .map((option) => option[key] || 0)
        .reduce((sum, current) => sum + current, 0)
    );
    const levelMatched = overflow
      ? sumLevel1 >= totalLevels || sumLevel2 >= totalLevels
      : sumLevel1 === totalLevels || sumLevel2 === totalLevels;
    setSubmitable(
      single
        ? result.length === 1
        : result.length >= min && result.length <= max && levelMatched
    );
  }, [result.length]);

  const grouped = groupBy(selectables, (option) => option.location?.zone!);

  const zoneOptions = grouped.map((x) => ({
    value: x[0],
    label: fetchStrings("!system", x[0] + 1000),
  }));

  const [selectedZone, setSelectedZone] = useState(zoneOptions[0]?.value);

  useEffect(() => {
    setSelectedZone(zoneOptions[0]?.value);
  }, [selectables]);

  const [submitText, finishText, cancelText] = [1211, 1296, 1295].map((n) =>
    fetchStrings("!system", n)
  );

  return (
    <NeosModal
      title={
        <>
          <span>{preHintMsg}</span>
          <span>{selectHintMsg}</span>
          <span>(请选择 {single ? 1 : minMaxText} 张卡)</span>
        </>
      } // TODO: 这里可以再细化一些
      width={600}
      okButtonProps={{
        disabled: !submitable,
      }}
      open={isOpen}
      footer={
        <>
          {cancelable && (
            <Button danger onClick={onCancel}>
              {cancelText}
            </Button>
          )}
          {finishable && (
            <Button type="dashed" onClick={onFinish}>
              {finishText}
            </Button>
          )}
          <Button
            type="primary"
            disabled={!submitable}
            onClick={() => onSubmit(mustSelects)}
          >
            {submitText}
          </Button>
        </>
      }
    >
      <div className="check-container">
        <Space
          direction="vertical"
          style={{ width: "100%", overflow: "hidden" }}
        >
          <Selector
            zoneOptions={zoneOptions}
            selectedZone={selectedZone}
            onChange={setSelectedZone as any}
          />
          {grouped.map(
            (options, i) =>
              options[0] === selectedZone && (
                <div className="checkcard-container" key={i}>
                  <CheckCard.Group
                    onChange={setResult as any}
                    // TODO 考虑如何设置默认值，比如只有一个的，就直接选中
                    multiple={!single}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6, 1fr)",
                      gap: 10,
                    }}
                  >
                    {options[1].map((card, j) => (
                      <Tooltip
                        title={card.effectDesc}
                        placement="bottom"
                        key={j}
                      >
                        {/* 这儿必须有一个div，不然tooltip不生效 */}
                        <div>
                          <CheckCard
                            cover={
                              <YgoCard
                                code={card.meta.id}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                }}
                              />
                            }
                            style={{
                              width: 100,
                              aspectRatio: 5.9 / 8.6,
                              marginInlineEnd: 0,
                              marginBlockEnd: 0,
                              flexShrink: 0,
                            }}
                            value={card}
                            onClick={() => {
                              showCardModal(card);
                            }}
                          />
                        </div>
                      </Tooltip>
                    ))}
                  </CheckCard.Group>
                </div>
              )
          )}
        </Space>
      </div>
    </NeosModal>
  );
};

/** 选择区域 */
const Selector: FC<{
  zoneOptions: {
    value: ygopro.CardZone;
    label: string;
  }[];
  selectedZone: ygopro.CardZone;
  onChange: (value: ygopro.CardZone) => void;
}> = ({ zoneOptions, selectedZone, onChange }) =>
  zoneOptions.length > 1 ? (
    <Segmented
      block
      options={zoneOptions}
      style={{ margin: "10px 0" }}
      value={selectedZone}
      onChange={onChange as any}
    />
  ) : (
    <></>
  );

export interface Option {
  // card id
  meta: CardMeta;
  location?: ygopro.CardLocation;
  // 效果
  effectDesc?: string;
  // 作为素材的cost，比如同调召唤的星级
  level1?: number;
  level2?: number;
  response: number;
}

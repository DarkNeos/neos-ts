import "./index.scss";

import { CheckCard } from "@ant-design/pro-components";
import { Button, Segmented, Space, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { INTERNAL_Snapshot as Snapshot, useSnapshot } from "valtio";

import type { CardMeta, ygopro } from "@/api";
import { fetchStrings } from "@/api";
import { CardType, matStore } from "@/stores";
import { YgoCard } from "@/ui/Shared";

import { groupBy } from "../../utils";
import { showCardModal } from "../CardModal";
import { NeosModal } from "../NeosModal";

export interface SelectCardsModalProps {
  isOpen: boolean;
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
}

export const SelectCardsModal: React.FC<SelectCardsModalProps> = ({
  isOpen,
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
  // FIXME: handle `selecteds`
  const [result, setResult] = useState<Option[]>([]);
  const [submitable, setSubmitable] = useState(false);

  const hint = useSnapshot(matStore.hint);
  const preHintMsg = hint?.esHint || "";
  const selectHintMsg = hint?.esSelectHint || "请选择卡片";

  const minMaxText = min === max ? min : `${min}-${max}`;

  const isMultiple = !single && min > 1;

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
          <span>(请选择 {minMaxText} 张卡)</span>
          <span>{single ? "每次选择一张" : ""}</span>
        </>
      } // TODO: 这里可以再细化一些
      width={600}
      okButtonProps={{
        disabled: !submitable,
      }}
      open={isOpen}
      footer={
        <>
          {cancelable && <Button onClick={onCancel}>{cancelText}</Button>}
          {finishable && (
            <Button type="primary" onClick={onFinish}>
              {finishText}
            </Button>
          )}
          <Button
            type="primary"
            disabled={!submitable}
            onClick={() => onSubmit([...mustSelects, ...result])}
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
          {selecteds.map((card, i) => (
            <OptionCard key={i} {...card as Option} />
          ))}
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
                    onChange={(res) => {
                      setResult((isMultiple ? res : [res]) as any);
                    }}
                    // TODO 考虑如何设置默认值，比如只有一个的，就直接选中
                    multiple={isMultiple}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6, 1fr)",
                      gap: 10,
                    }}
                  >
                    {options[1].map((card, j) => (
                      <OptionCard key={j} {...(card as Option)} />
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
const Selector: React.FC<{
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

const OptionCard: React.FC<Option> = (props) => {
  const { effectDesc, meta } = props;
  return (
    <Tooltip title={effectDesc} placement="bottom">
      {/* 这儿必须有一个div，不然tooltip不生效 */}
      <div>
        <CheckCard
          cover={
            <YgoCard
              code={meta.id}
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
          value={props}
          onClick={() => {
            showCardModal(props);
          }}
        />
      </div>
    </Tooltip>
  );
};

export interface Option {
  // card id
  meta: CardMeta;
  location?: ygopro.CardLocation;
  // 效果
  effectDesc?: string;
  // 作为素材的cost，比如同调召唤的星级
  level1?: number;
  level2?: number;
  response?: number;
  // 便于直接返回这个信息
  card?: CardType;
}

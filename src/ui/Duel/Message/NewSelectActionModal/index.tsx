import { CheckCard, CheckCardProps } from "@ant-design/pro-components";
import {
  Button,
  Card,
  Col,
  Popover,
  Row,
  Tabs,
  Segmented,
  Space,
  Typography,
  Tooltip,
} from "antd";
import { type FC, useState, useEffect } from "react";
import { useSnapshot, proxy } from "valtio";

import {
  fetchStrings,
  sendSelectMultiResponse,
  sendSelectSingleResponse,
} from "@/api";
import type { CardMeta, ygopro } from "@/api";
import { useConfig } from "@/config";
import { matStore } from "@/stores";

import { groupBy } from "../../utils";

import { NewModal } from "../NewModal";
import { YgoCard } from "@/ui/Shared";
import "./index.scss";

const CANCEL_RESPONSE = -1;
const FINISH_RESPONSE = -1;

const defaultProps = {
  isOpen: false,
  isValid: false, // FIXME 看起来是最小化用的，看情况是否需要删掉
  isChain: false,
  min: 0,
  max: 0,
  single: true,
  selecteds: [] as Option[], // 最少选择多少卡
  selectables: [] as Option[], // 最多选择多少卡
  mustSelects: [] as Option[], // 单选
  cancelable: false, // 能否取消
  finishable: false, // 选择足够了之后，能否确认
  totalLevels: 0, // 需要的总等级数（用于同调/仪式/...）
  overflow: false, // 选择等级时候，是否可以溢出
};

const localStore = proxy(defaultProps);

export const NewSelectActionsModal: FC = () => {
  const {
    isOpen,
    isValid,
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
  } = useSnapshot(localStore);

  const [response, setResponse] = useState<Option[]>([]);
  const [submitable, setSubmitable] = useState(false);

  const hint = useSnapshot(matStore.hint);
  const preHintMsg = hint?.esHint || "";
  const selectHintMsg = hint?.esSelectHint || "请选择卡片";

  const minMaxText = min === max ? min : `${min}-${max}`;

  // 判断是否可以提交
  useEffect(() => {
    const [sumLevel1, sumLevel2] = (["level1", "level2"] as const).map((key) =>
      [...mustSelects, ...response]
        .map((option) => option[key] || 0)
        .reduce((sum, current) => sum + current, 0)
    );
    const levelMatched = overflow
      ? sumLevel1 >= totalLevels || sumLevel2 >= totalLevels
      : sumLevel1 === totalLevels || sumLevel2 === totalLevels;
    setSubmitable(
      single
        ? response.length == 1
        : response.length >= min && response.length <= max && levelMatched
    );
  }, [response.length]);

  const grouped = groupBy(selectables, (option) => option.location?.zone!);

  const zoneOptions = grouped.map((x) => ({
    value: x[0],
    label: fetchStrings("!system", x[0] + 1000),
  }));

  const [selectedZone, setSelectedZone] = useState(zoneOptions[0]?.value);

  useEffect(() => {
    setSelectedZone(zoneOptions[0]?.value);
  }, [selectables]);

  const onSubmit = () => {
    const values = mustSelects
      .concat(response)
      .map((option) => option.response);
    if (isChain) {
      sendSelectSingleResponse(values[0]);
    } else {
      sendSelectMultiResponse(values);
    }
    rs();
  };

  const onFinish = () => {
    sendSelectSingleResponse(FINISH_RESPONSE);
    rs();
  };

  const onCancel = () => {
    sendSelectSingleResponse(CANCEL_RESPONSE);
    rs();
  };

  const [submitText, finishText, cancelText] = [1211, 1296, 1295].map((n) =>
    fetchStrings("!system", n)
  );

  return (
    <NewModal
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
          <Button danger disabled={!cancelable} onClick={onCancel}>
            {cancelText}
          </Button>
          <Button type="dashed" disabled={!finishable} onClick={onFinish}>
            {finishText}
          </Button>
          <Button type="primary" disabled={!submitable} onClick={onSubmit}>
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
          {grouped.map((options, i) => (
            <div className="checkcard-container" key={i}>
              <CheckCard.Group
                onChange={setResponse as any}
                // TODO 考虑如何设置默认值，比如只有一个的，就直接选中
                multiple
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: 10,
                }}
              >
                {options[1].map((card, j) => (
                  <Tooltip title={card.effectDesc} placement="bottom" key={j}>
                    <div>
                      <CheckCard
                        cover={<YgoCard code={card.meta.id} />}
                        style={{
                          width: 100,
                          aspectRatio: 5.9 / 8.6,
                          marginInlineEnd: 0,
                          marginBlockEnd: 0,
                          flexShrink: 0,
                        }}
                        value={card}
                      />
                    </div>
                  </Tooltip>
                ))}
              </CheckCard.Group>
            </div>
          ))}
        </Space>
      </div>
    </NewModal>
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

const config = useConfig();

let rs: (v?: any) => void = () => {};

export const displaySelectActionsModal = async (
  args: Partial<Omit<typeof defaultProps, "isOpen">>
) => {
  resetSelectActionsModal(); // 先重置为初始状态
  localStore.isOpen = true;
  Object.entries(args).forEach(([key, value]) => {
    // @ts-ignore
    localStore[key] = value;
  });
  await new Promise<void>((resolve) => (rs = resolve)); // 等待在组件内resolve
  localStore.isOpen = false;
};

const resetSelectActionsModal = () => {
  Object.keys(defaultProps).forEach((key) => {
    // @ts-ignore
    localStore[key] = defaultProps[key];
  });
};

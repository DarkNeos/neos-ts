import { CheckCard } from "@ant-design/pro-components";
import { Button, Segmented } from "antd";
import { chunk } from "lodash-es";
import React, { useEffect, useState } from "react";
import { proxy, useSnapshot } from "valtio";

import {
  type CardMeta,
  fetchStrings,
  getCardStr,
  Region,
  sendSelectIdleCmdResponse,
  sendSelectOptionResponse,
} from "@/api";
import { Container } from "@/container";
import { getUIContainer } from "@/container/compat";

import { NeosModal } from "../NeosModal";

type Options = { info: string; response: number }[];

const defaultStore = {
  title: "",
  isOpen: false,
  min: 1,
  options: [] satisfies Options as Options,
};
const store = proxy(defaultStore);

// 一页最多4个选项
const MAX_NUM_PER_PAGE = 4;

export const OptionModal = () => {
  const container = getUIContainer();
  const snap = useSnapshot(store);
  const { title, isOpen, min, options } = snap;
  // options可能太多，因此分页展示
  const [page, setPage] = useState(0);
  const maxPage = Math.ceil(options.length / MAX_NUM_PER_PAGE);
  const [selecteds, setSelecteds] = useState<number[][]>([]);
  const grouped = chunk(options, MAX_NUM_PER_PAGE);

  const onSummit = () => {
    const responses = selecteds.flat();
    if (responses.length > 0) {
      const response = responses.reduce((res, current) => res | current, 0); // 多个选择求或
      sendSelectOptionResponse(container.conn, response);
      rs();
    }
  };

  useEffect(() => {
    setSelecteds(Array.from({ length: maxPage }).map((_) => []));
  }, [options]);

  return (
    <NeosModal
      title={title}
      open={isOpen}
      footer={
        <Button disabled={selecteds.flat().length !== min} onClick={onSummit}>
          确定
        </Button>
      }
    >
      <Selector page={page} maxPage={maxPage} onChange={setPage as any} />
      {grouped.map(
        (options, i) =>
          i === page && (
            <CheckCard.Group
              key={i}
              bordered
              multiple
              value={selecteds[i]}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "0.625rem",
              }}
              onChange={(values: any) => {
                const v = selecteds.map((x, i) => (i === page ? values : x));
                setSelecteds(v);
              }}
            >
              {options.map((option, idx) => (
                <CheckCard
                  key={idx}
                  style={{
                    width: "12.5rem",
                    fontSize: "1rem",
                    marginInlineEnd: 0,
                    marginBlockEnd: 0,
                  }}
                  title={option.info}
                  value={option.response}
                />
              ))}
            </CheckCard.Group>
          ),
      )}
    </NeosModal>
  );
};

/* 选择区域 */
const Selector: React.FC<{
  page: number;
  maxPage: number;
  onChange: (value: number) => void;
}> = ({ page, maxPage, onChange }) =>
  maxPage > 1 ? (
    <Segmented
      block
      options={Array.from({ length: maxPage }).map((_, idx) => idx)}
      style={{ margin: "0.625rem 0" }}
      value={page}
      onChange={onChange as any}
    ></Segmented>
  ) : (
    <></>
  );

let rs: (v?: any) => void = () => {};
export const displayOptionModal = async (
  title: string,
  options: Options,
  min: number,
) => {
  store.title = title;
  store.options = options;
  store.min = min;
  store.isOpen = true;
  await new Promise((resolve) => (rs = resolve));
  store.isOpen = false;
};

export const handleEffectActivation = async (
  container: Container,
  meta: CardMeta,
  effectInteractivies: {
    desc: string;
    response: number;
    effectCode: number | undefined;
  }[],
) => {
  if (!effectInteractivies.length) {
    return;
  }
  if (effectInteractivies.length === 1) {
    // 如果只有一个效果，点击直接触发
    sendSelectIdleCmdResponse(container.conn, effectInteractivies[0].response);
  } else {
    // optionsModal
    const options = effectInteractivies.map((effect) => {
      const effectMsg =
        meta && effect.effectCode
          ? getCardStr(meta, effect.effectCode & 0xf) ?? "[:?]"
          : "[:?]";
      return {
        info: effectMsg,
        response: effect.response,
      };
    });
    await displayOptionModal(fetchStrings(Region.System, 556), options, 1); // 主动发动效果，所以不需要await，但是以后可能要留心
  }
};

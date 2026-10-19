import { CheckCard } from "@ant-design/pro-components";
import { Button } from "antd";
import { useEffect, useState } from "react";
import { proxy, useSnapshot } from "valtio";

import { type CardMeta, sendSelectOptionResponse } from "@/api";
import { getUIContainer } from "@/container/compat";
import { matStore } from "@/stores";
import { DuelChoice } from "@/stores/duelChoice";
import { ScrollableArea, YgoCard } from "@/ui/Shared";

import { NeosModal } from "../NeosModal";
import styles from "./index.module.scss";

type Options = { info: string; response: number; card?: CardMeta }[];

const defaultStore = {
  title: "",
  isOpen: false,
  requestId: 0,
  min: 1,
  options: [] satisfies Options as Options,
};
const store = proxy({ ...defaultStore });

export const OptionModal = () => {
  const snap = useSnapshot(store);
  const { title, isOpen, min, options, requestId } = snap;
  const hint = useSnapshot(matStore.hint);
  const [selecteds, setSelecteds] = useState<number[]>([]);

  const onSummit = () => {
    // eslint-disable-next-line valtio/state-snapshot-rule -- 旧事件必须携带原请求编号。
    choice.submit(selecteds, requestId);
  };

  useEffect(() => {
    setSelecteds([]);
  }, [requestId]);

  const onQuickSelect = (response: number) => {
    // eslint-disable-next-line valtio/state-snapshot-rule -- 旧事件必须携带原请求编号。
    if (store.min === 1) choice.submit([response], requestId);
  };

  return (
    <NeosModal
      movable
      title={title}
      open={isOpen}
      footer={
        <Button
          data-testid="duel-option-submit"
          disabled={selecteds.length !== min}
          onClick={onSummit}
        >
          确定
        </Button>
      }
    >
      <div data-testid="duel-option-modal" data-option-min={min}>
        {hint.esHint && <p className={styles.hint}>{hint.esHint}</p>}
        <ScrollableArea maxHeight="50vh" className={styles.container}>
          <CheckCard.Group
            bordered
            multiple={min !== 1}
            value={min === 1 ? selecteds[0] : selecteds}
            className={styles["check-card-group"]}
            onChange={(value) =>
              setSelecteds(
                Array.isArray(value)
                  ? (value as number[])
                  : typeof value === "number"
                  ? [value]
                  : [],
              )
            }
          >
            {options.map((option) => (
              <div
                key={option.response}
                data-testid="duel-option-item"
                data-option-response={option.response}
                data-option-text={option.info}
                onDoubleClick={() => onQuickSelect(option.response)}
              >
                <CheckCard
                  className={styles["check-card"]}
                  description={
                    <div className={styles.content}>
                      {option.card && (
                        <div
                          className={styles.source}
                          data-testid="duel-option-card"
                          data-card-code={option.card.id}
                        >
                          <YgoCard code={option.card.id} width="3.5rem" />
                          <div>
                            <span>效果来源</span>
                            <strong>
                              {option.card.text.name || option.card.id}
                            </strong>
                          </div>
                        </div>
                      )}
                      <div className={styles.description}>{option.info}</div>
                    </div>
                  }
                  value={option.response}
                />
              </div>
            ))}
          </CheckCard.Group>
        </ScrollableArea>
      </div>
    </NeosModal>
  );
};

const choice = new DuelChoice<number[]>(() => {
  store.isOpen = false;
  store.title = "";
  store.options = [];
});

const responseOf = (values: number[]) =>
  values.reduce((result, value) => result | value, 0);

function presentOptions(
  title: string,
  options: Options,
  min: number,
  adapter: {
    respond(response: number): boolean;
    eligible?(): boolean;
    signal?: AbortSignal;
  },
) {
  const request = choice.open({
    ...adapter,
    respond: (values) => adapter.respond(responseOf(values)),
    validate: (values) =>
      values.length === min &&
      new Set(values).size === values.length &&
      values.every((value) =>
        options.some((option) => option.response === value),
      ),
  });
  if (!request) return Promise.resolve(undefined);
  store.title = title;
  store.options = options;
  store.min = min;
  store.requestId = request.id;
  store.isOpen = true;
  return request.result.then((values) => values && responseOf(values));
}

export const displayOptionModal = (
  title: string,
  options: Options,
  min: number,
) => {
  const conn = getUIContainer().conn;
  return presentOptions(title, options, min, {
    eligible: () => getUIContainer().conn === conn,
    respond: (response) => sendSelectOptionResponse(conn, response),
  });
};

export const chooseOption = (
  title: string,
  options: Options,
  signal: AbortSignal,
) => presentOptions(title, options, 1, { respond: () => true, signal });

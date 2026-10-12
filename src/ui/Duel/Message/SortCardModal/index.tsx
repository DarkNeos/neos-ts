import { Button } from "antd";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { proxy, useSnapshot } from "valtio";

import { type CardMeta, sendSortCardResponse } from "@/api";
import { getUIContainer } from "@/container/compat";
import { createDuelDialog } from "@/stores/duelDialogs";
import { ScrollableArea, YgoCard } from "@/ui/Shared";

import { showCardModal } from "../CardModal";
import { NeosModal } from "../NeosModal";
import styles from "./index.module.scss";

interface SortOption {
  meta: CardMeta;
  response: number;
}
interface SortCardModalProps {
  isOpen: boolean;
  options: SortOption[];
}

const localStore = proxy<SortCardModalProps>({
  isOpen: false,
  options: [],
});

export const SortCardModal = () => {
  const container = getUIContainer();
  const { isOpen, options } = useSnapshot(localStore);
  const [selecteds, setSelecteds] = useState<number[]>([]);
  const complete = options.length > 0 && selecteds.length === options.length;

  useEffect(() => {
    setSelecteds([]);
  }, [options, isOpen]);

  const onFinish = (order = selecteds) => {
    if (
      !localStore.isOpen ||
      order.length === 0 ||
      order.length !== localStore.options.length
    )
      return;
    // 协议按原候选顺序返回排序后的位置，不能直接发送玩家的点击顺序。
    // 例如点击顺序 [2, 0, 1] 应转换为位置数组 [1, 2, 0]。
    const ranks = new Array<number>(localStore.options.length);
    order.forEach((response, position) => {
      ranks[response] = position;
    });
    sendSortCardResponse(container.conn, ranks);
    rs();
  };

  return (
    <NeosModal
      movable
      title="请为卡片排序"
      width="38.25rem"
      open={isOpen}
      footer={
        <>
          <Button
            data-testid="duel-sort-card-reset"
            disabled={selecteds.length === 0}
            onClick={() => setSelecteds([])}
          >
            重选
          </Button>
          <Button
            data-testid="duel-sort-card-quick-select"
            disabled={options.length === 0}
            title="保留已选顺序，按列表顺序补齐并确认"
            onClick={() =>
              onFinish([
                ...selecteds,
                ...options
                  .map((option) => option.response)
                  .filter((response) => !selecteds.includes(response)),
              ])
            }
          >
            快速选择
          </Button>
          <Button
            data-testid="duel-sort-card-submit"
            type="primary"
            disabled={!complete}
            onClick={() => onFinish()}
          >
            确认顺序
          </Button>
        </>
      }
    >
      <div data-testid="duel-sort-card-modal">
        <p className={styles.hint}>
          按顺序点击卡片，标记 1、2、3…；再次点击可取消并重新排序。
        </p>
        <ScrollableArea
          className={styles.cards}
          scrollProps={{
            tabIndex: 0,
            options: {
              overflow: { x: "scroll", y: "hidden" },
              scrollbars: { autoHide: "never", theme: "os-theme-light" },
            },
          }}
        >
          {options.map((option) => {
            const order = selecteds.indexOf(option.response) + 1;
            return (
              <button
                key={option.response}
                type="button"
                className={classNames(styles.card, {
                  [styles.selected]: order > 0,
                })}
                data-testid="duel-sort-card-option"
                data-card-code={option.meta.id}
                data-card-response={option.response}
                data-card-order={order || undefined}
                aria-label={`${option.meta.text.name || "卡片"}，${
                  order > 0 ? `顺序 ${order}` : "未排序"
                }`}
                aria-pressed={order > 0}
                onClick={() => {
                  showCardModal(option);
                  setSelecteds((current) =>
                    current.includes(option.response)
                      ? current.filter(
                          (response) => response !== option.response,
                        )
                      : [...current, option.response],
                  );
                }}
              >
                <YgoCard code={option.meta.id} width="100%" />
                {order > 0 && (
                  <span className={styles.order} aria-hidden>
                    {order}
                  </span>
                )}
              </button>
            );
          })}
        </ScrollableArea>
        <p className={styles.progress} aria-live="polite">
          已排序 {selecteds.length} / {options.length}
        </p>
      </div>
    </NeosModal>
  );
};

const dialog = createDuelDialog(() => {
  localStore.isOpen = false;
  localStore.options = [];
}, undefined);
const rs = dialog.finish;

export const displaySortCardModal = async (options: SortOption[]) => {
  localStore.options = options;
  localStore.isOpen = true;
  await dialog.wait();
};

import { LockOutlined } from "@ant-design/icons";
import { CheckCard } from "@ant-design/pro-components";
import { Button, Card, Space, Tooltip } from "antd";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";

import { Region, ygopro } from "@/api";
import { fetchStrings } from "@/api";
import { matStore } from "@/stores";
import type { CardSelectionProcess } from "@/stores/cardSelectionProcess";
import type { CardSelectionOption as Option } from "@/stores/cardSelectionTypes";

export type { CardSelectionOption as Option } from "@/stores/cardSelectionTypes";
import { ScrollableArea, YgoCard } from "@/ui/Shared";

import { groupBy } from "../../utils";
import { showCardModal } from "../CardModal";
import { NeosModal } from "../NeosModal";
import styles from "./index.module.scss";

export interface SelectCardsModalProps {
  process: CardSelectionProcess<Option>;
}

export const SelectCardsModal: React.FC<SelectCardsModalProps> = ({
  process,
}) => {
  const state = useSnapshot(process.state);
  const hint = useSnapshot(matStore.hint);
  const { t: i18n } = useTranslation("SelectCardModal");
  if (!state.active || !state.request) return null;
  const {
    min,
    max,
    single,
    selecteds = [],
    selectables,
    mustSelects,
    cancelable,
    finishable,
    isChain = false,
  } = state.request;
  // 分组只调整展示顺序；勾选仍取原候选索引，响应仍使用服务器序号。
  // card.selected 展示累计已选的蓝框，checked 只表示玩家本次勾选。
  const grouped = groupBy(selectables, (option) => option.location?.zone!);
  const multipleZones = grouped.length > 1;
  const preHintMsg = hint.esHint || "";
  const selectHintMsg = hint.esSelectHint || "请选择卡片";
  const minMaxText = min === max ? min : `${min}-${max}`;
  const [submitText, finishText, cancelText] = [1211, 1296, 1295].map((n) =>
    fetchStrings(Region.System, n),
  );
  return (
    <NeosModal
      movable
      title={
        <>
          <span>{preHintMsg}</span>
          {preHintMsg && " "}
          <span>{selectHintMsg}</span>
          <span>
            ({i18n("PleaseSelect")} {minMaxText} {i18n("Cards")})
          </span>
          <span>{single ? i18n("SelectOneCardAtTime") : ""}</span>
        </>
      } // TODO: 这里可以再细化一些
      width={"38.25rem"}
      okButtonProps={{
        disabled: !state.valid,
      }}
      open={state.active}
      footer={
        <>
          {cancelable && (
            <Button
              data-testid="duel-select-card-cancel"
              onClick={() => process.cancel()}
            >
              {cancelText}
            </Button>
          )}
          {finishable && (
            <Button
              data-testid="duel-select-card-finish"
              type="primary"
              onClick={() => process.finishSelection()}
            >
              {finishText}
            </Button>
          )}
          <Button
            data-testid="duel-select-card-submit"
            type="primary"
            disabled={!state.valid}
            onClick={() => process.submit()}
          >
            {submitText}
          </Button>
        </>
      }
    >
      <Space
        data-testid="duel-select-cards-modal"
        data-select-min={min}
        data-select-max={max}
        data-select-single={single}
        data-select-is-chain={isChain}
        data-select-cancelable={cancelable}
        data-select-finishable={finishable}
        direction="vertical"
        style={{ width: "100%", overflow: "hidden" }}
      >
        <ScrollableArea maxHeight="50vh" className={styles.groups}>
          {mustSelects.length > 0 && (
            <section
              className={styles.container}
              data-testid="duel-select-card-mandatory"
            >
              <h3 className={styles["group-title"]}>
                {fetchStrings(Region.System, 212)}
              </h3>
              <div className={styles["check-group"]}>
                {mustSelects.map((card, i) => (
                  <Tooltip title={card.effectDesc} placement="bottom" key={i}>
                    <div
                      className={styles["mandatory-card"]}
                      data-testid="duel-select-card-mandatory-option"
                      data-card-code={card.meta.id}
                      data-card-response={card.response}
                    >
                      <CheckCard
                        checked
                        cover={
                          <YgoCard
                            code={card.meta.id}
                            targeted={card.targeted}
                            className={styles.card}
                          />
                        }
                        className={styles["check-card"]}
                        onClick={() => showCardModal(card)}
                      />
                      <LockOutlined
                        className={styles["mandatory-lock"]}
                        aria-hidden
                      />
                    </div>
                  </Tooltip>
                ))}
              </div>
            </section>
          )}
          {grouped.map(([zone, cards]) => (
            <CardZoneGroup zone={zone} horizontal={multipleZones} key={zone}>
              <div
                className={classnames(styles["check-group"], {
                  [styles["horizontal-group"]]: multipleZones,
                })}
              >
                {cards.map((card, j) => (
                  <Tooltip title={card.effectDesc} placement="bottom" key={j}>
                    {/* 这儿必须有一个div，不然tooltip不生效 */}
                    <div
                      data-testid="duel-select-card-option"
                      data-card-code={card.meta.id}
                      data-card-controller={card.location?.controller}
                      data-card-zone={
                        card.location?.zone === undefined
                          ? undefined
                          : ygopro.CardZone[card.location.zone]
                      }
                      data-card-zone-value={card.location?.zone}
                      data-card-sequence={card.location?.sequence}
                      data-card-response={card.response}
                      onDoubleClick={() =>
                        process.quickSubmit(selectables.indexOf(card))
                      }
                    >
                      <CheckCard
                        cover={
                          <YgoCard
                            code={card.meta.id}
                            targeted={card.targeted}
                            disabled={card.disabled}
                            className={styles.card}
                          />
                        }
                        className={classnames(styles["check-card"], {
                          [styles.selected]: card.selected,
                        })}
                        checked={state.selected.includes(
                          selectables.indexOf(card),
                        )}
                        onClick={() => {
                          showCardModal(card);
                          process.toggle(selectables.indexOf(card));
                        }}
                      />
                    </div>
                  </Tooltip>
                ))}
              </div>
            </CardZoneGroup>
          ))}
        </ScrollableArea>
        <p>
          <span>
            {/* TODO: 这里的字体可以调整下 */}
            {selecteds.length > 0 ? fetchStrings(Region.System, 212) : ""}
          </span>
        </p>
        <div className={styles["check-group"]}>
          {selecteds.map((card, i) => (
            <Tooltip
              title={card.effectDesc}
              placement="bottom"
              key={grouped.length + i}
            >
              <div
                data-testid="duel-select-card-selected-option"
                data-card-code={card.meta.id}
                data-card-response={card.response}
              >
                <Card
                  cover={
                    <YgoCard
                      code={card.meta.id}
                      targeted={card.targeted}
                      className={styles.card}
                    />
                  }
                  className={classnames(styles["check-card"], styles.selected)}
                  onClick={() => {
                    showCardModal(card);
                  }}
                />
              </div>
            </Tooltip>
          ))}
        </div>
      </Space>
    </NeosModal>
  );
};

const CardZoneGroup: React.FC<
  React.PropsWithChildren<{
    zone: ygopro.CardZone;
    horizontal: boolean;
  }>
> = ({ zone, horizontal, children }) => {
  const label = fetchStrings(Region.System, zone + 1000);

  return (
    <section
      className={styles.container}
      data-testid="duel-select-card-group"
      data-card-zone={ygopro.CardZone[zone]}
      aria-label={label}
    >
      {horizontal && <h3 className={styles["group-title"]}>{label}</h3>}
      <div
        className={horizontal ? styles["row-viewport"] : undefined}
        data-testid="duel-select-card-row"
      >
        {horizontal ? (
          <ScrollableArea
            className={styles["row-content"]}
            scrollProps={{
              tabIndex: 0,
              options: {
                overflow: { x: "scroll", y: "hidden" },
                scrollbars: {
                  autoHide: "never",
                  theme: "os-theme-light",
                },
              },
            }}
          >
            {children}
          </ScrollableArea>
        ) : (
          children
        )}
      </div>
    </section>
  );
};

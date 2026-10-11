import { animated, to, useSpring } from "@react-spring/web";
import { Dropdown, type MenuProps } from "antd";
import classnames from "classnames";
import React, {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useSnapshot } from "valtio";

import { getCardImgUrl, ygopro } from "@/api";
import { isExtraDeckCard } from "@/common";
import { getUIContainer } from "@/container/compat";
import { eventbus, Task } from "@/infra";
import {
  cardStore,
  CardType,
  InteractType,
  isCardDisabled,
  matStore,
} from "@/stores";
import { appearanceStore, sleeveUrl } from "@/stores/appearanceStore";
import { fieldInspection } from "@/stores/fieldInspection";
import { fieldSelection, toggleFieldSelection } from "@/stores/fieldSelection";
import { showCardModal as displayCardModal } from "@/ui/Duel/Message/CardModal";
import { YgoCard } from "@/ui/Shared";

import { displayCardListModal } from "../../Message";
import { interactTypeToIcon, interactTypeToString } from "../../utils";
import { CardChainMarkers } from "../ChainCards";
import { matConfig } from "../css";
import { FieldCardInfo } from "./FieldCardInfo";
import { LinkArrows } from "./FieldSigns";
import styles from "./index.module.scss";
import {
  attack,
  type AttackOptions,
  confirm,
  type ConfirmOptions,
  focus,
  move,
  type MoveOptions,
  shuffle,
  type ShuffleOptions,
} from "./springs";
import type { SpringApiProps } from "./springs/types";

const { DECK, HAND, GRAVE, REMOVED, EXTRA, MZONE, SZONE, TZONE } =
  ygopro.CardZone;
const CARD_HEIGHT = matConfig.DECK_CARD_HEIGHT;

interface CardProps {
  idx: number;
  extraStackIndex?: number;
  relationActive: boolean;
  visible: boolean;
}

export const Card: React.FC<CardProps> = React.memo((props) => {
  const { idx, extraStackIndex, relationActive, visible } = props;
  const container = getUIContainer();
  const card = cardStore.inner[idx];
  const snap = useSnapshot(card);
  const appearance = useSnapshot(appearanceStore);
  const mat = useSnapshot(matStore);
  mat.selfType;
  const sleeveSide = matStore.isMe(snap.sleeveOwner ?? snap.location.controller)
    ? "me"
    : "op";
  const sleeveDeck =
    snap.sleeveType === "extra" || isExtraDeckCard(snap.meta.data.type ?? 0)
      ? "Extra"
      : "Main";
  const backSrc = sleeveUrl(appearance[`${sleeveSide}${sleeveDeck}`]);
  const selecting = useSnapshot(fieldSelection).active;
  const [presenting, setPresenting] = useState(false);

  const [spring, api] = useSpring<SpringApiProps>(
    () =>
      ({
        x: 0,
        y: 0,
        z: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        zIndex: 0,
        height: 0,
        focusScale: 1,
        focusDisplay: "none",
        focusOpacity: 1,
        subZ: 0,
        opacity: 1,
      }) satisfies SpringApiProps,
  );

  // 每张卡都需要移动到初始位置
  useLayoutEffect(() => {
    addToAnimation(() => move({ card, api }), false);
  }, []);

  const [classFocus, setClassFocus] = useState(false);
  const outsideSequence =
    [GRAVE, REMOVED].includes(snap.location.zone) && !snap.location.is_overlay
      ? snap.location.sequence
      : undefined;
  // 其他卡进出时只更新叠放层级，发动展示结束后再恢复正常顺序。
  useEffect(() => {
    if (outsideSequence !== undefined && !classFocus)
      api.set({ zIndex: outsideSequence });
  }, [api, outsideSequence, classFocus]);

  const [glowing, setGrowing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [overlayAnimation, setOverlayAnimation] =
    useState<MoveOptions["overlayAnimation"]>();

  // 其他卡插入或离开额外卡组后，同步保留下来的卡片，展示动画结束后恢复层级。
  useEffect(() => {
    if (
      extraStackIndex !== undefined &&
      !classFocus &&
      !confirming &&
      !shuffling
    )
      api.set({ z: extraStackIndex, zIndex: extraStackIndex });
  }, [api, extraStackIndex, classFocus, confirming, shuffling]);

  // >>> 动画 >>>
  /** 动画序列的promise */
  const animationQueue = useRef(new Promise<void>((rs) => rs()));

  const addToAnimation = (p: () => Promise<void>, present = true) => {
    const animation = animationQueue.current.then(async () => {
      if (present) setPresenting(true);
      try {
        await p();
      } finally {
        if (present) setPresenting(false);
      }
    });
    animationQueue.current = animation;
    return animation;
  };

  const register = <T extends any[]>(
    task: Task,
    fn: (...args: T) => Promise<unknown>,
  ) => {
    return eventbus.register(task, async (uuid, ...rest: T) => {
      if (uuid === card.uuid) {
        await fn(...rest);
        return true;
      } else return false;
    });
  };

  useEffect(() => {
    const unregister = [
      register(Task.Move, async (options?: MoveOptions) => {
        await addToAnimation(async () => {
          setOverlayAnimation(options?.overlayAnimation);
          try {
            await move({ card, api, options });
          } finally {
            setOverlayAnimation(undefined);
          }
        });
      }),
      register(Task.Focus, async () => {
        // 发动展示进入公共动画队列；结束或中断后释放临时置顶状态。
        await addToAnimation(async () => {
          setClassFocus(true);
          try {
            await focus({ card, api });
          } finally {
            setClassFocus(false);
          }
        });
      }),
      register(Task.Confirm, async (options?: ConfirmOptions) => {
        await addToAnimation(async () => {
          if (options?.signal?.aborted) return;
          setConfirming(true);
          try {
            await confirm({ card, api, options });
          } finally {
            setConfirming(false);
          }
        });
      }),
      register(Task.Attack, async (options: AttackOptions) => {
        await addToAnimation(() => attack({ card, api, options }));
      }),
      register(Task.Shuffle, async (options?: ShuffleOptions) => {
        await addToAnimation(async () => {
          if (options?.signal?.aborted) return;
          setShuffling(true);
          try {
            await shuffle({ card, api, options });
          } finally {
            setShuffling(false);
          }
        });
      }),
    ];
    return () => {
      unregister.forEach((remove) => remove());
    };
  }, []);

  // <<< 动画 <<<

  // >>> 效果 >>>
  const idleInteractivities = snap.idleInteractivities;
  useEffect(() => {
    setGrowing(
      !!idleInteractivities.length &&
        [MZONE, SZONE, HAND, TZONE].includes(card.location.zone),
    );
  }, [idleInteractivities]);

  const [dropdownMenu, setDropdownMenu] = useState({
    items: [] as DropdownItem[],
  });

  // 是否禁用下拉菜单
  const [dropdownMenuDisabled, setDropdownMenuDisabled] = useState(false);

  // 发动效果
  // 1. 下拉菜单里面选择[召唤 / 特殊召唤 /.../效果发动]
  // 2. 如果是非效果发动，那么直接选择哪张卡(单张卡直接选择那张)
  // 3. 如果是效果发动，那么选择哪张卡，然后选择效果
  const handleDropdownMenu = (cards: CardType[]) => {
    const choices = container.context.matStore.activeActions.options(cards);
    setDropdownMenuDisabled(!choices.length);
    setDropdownMenu({
      items: choices.map((choice, key) => ({
        key,
        "data-testid": `duel-action-${InteractType[
          choice.interactType
        ].toLowerCase()}`,
        "data-action-type": InteractType[choice.interactType],
        "data-action-card-count": choice.cards.length,
        "data-action-response": choice.response,
        "data-action-response-source": choice.responseSource,
        label: interactTypeToString(choice.interactType),
        icon: interactTypeToIcon(choice.interactType),
        onClick: () => {
          void choice.choose();
        },
      })),
    });
  };

  const onClick = () => {
    fieldInspection.pinned = card.uuid;
    if (toggleFieldSelection(card, displayCardModal)) return;
    const onCardClick = (card: CardType) => {
      // 中央弹窗展示选中卡牌信息
      // TODO: 同一张卡片，是否重复点击会关闭CardModal？
      displayCardModal(card);
      handleDropdownMenu([card]);

      // 侧边栏展示超量素材信息
      const overlayMaterials = cardStore.findOverlay(
        card.location.zone,
        card.location.controller,
        card.location.sequence,
      );
      if (overlayMaterials.length > 0) {
        displayCardListModal({
          isZone: false,
          monster: card,
        });
      }
    };

    const onFieldClick = (card: CardType) => {
      displayCardListModal({
        isZone: true,
        zone: card.location.zone,
        controller: card.location.controller,
      });
      // 收集这个zone的所有交互，并且在下拉菜单之中显示
      const cards = cardStore.at(card.location.zone, card.location.controller);
      handleDropdownMenu(cards);
    };

    if ([MZONE, SZONE, HAND].includes(card.location.zone)) {
      onCardClick(card);
    } else if ([EXTRA, GRAVE, REMOVED].includes(card.location.zone)) {
      onFieldClick(card);
    }
  };
  // <<< 效果 <<<

  const location = snap.location;
  const knownHand = location.zone === HAND && snap.code > 0;
  const previewSetCard =
    location.zone === SZONE &&
    !location.is_overlay &&
    [
      ygopro.CardPosition.FACEDOWN,
      ygopro.CardPosition.FACEDOWN_ATTACK,
      ygopro.CardPosition.FACEDOWN_DEFENSE,
    ].includes(location.position!) &&
    snap.code > 0 &&
    !confirming &&
    !classFocus &&
    !shuffling;
  const disabled = isCardDisabled(snap as CardType);
  const idleActions = snap.idleInteractivities
    .map(({ interactType }) => InteractType[interactType])
    .join(" ");
  const idleActionResponses = snap.idleInteractivities
    .map(
      ({ interactType, response }) =>
        `${InteractType[interactType]}:${response}`,
    )
    .join(" ");
  const idleActionSources = snap.idleInteractivities
    .map(
      ({ interactType, responseSource }) =>
        `${InteractType[interactType]}:${responseSource ?? "idle"}`,
    )
    .join(" ");
  const attackInteractivity = snap.idleInteractivities.find(
    ({ interactType }) => interactType === InteractType.ATTACK,
  );
  const showDetails = visible || presenting;
  const showStack =
    !showDetails &&
    !location.is_overlay &&
    [DECK, EXTRA, GRAVE, REMOVED].includes(location.zone);
  const stackCode = snap.code === 0 ? snap.meta.id : snap.code;
  const stackShowsBack =
    stackCode === 0 ||
    (![
      ygopro.CardPosition.FACEUP,
      ygopro.CardPosition.FACEUP_ATTACK,
      ygopro.CardPosition.FACEUP_DEFENSE,
    ].includes(location.position) &&
      !(showStack && location.zone === DECK && mat.deckReserved));

  return (
    <animated.div
      data-testid="duel-card"
      data-card-uuid={snap.uuid}
      data-card-code={snap.code}
      data-card-controller={location.controller}
      data-card-zone={ygopro.CardZone[location.zone]}
      data-card-zone-value={location.zone}
      data-card-sequence={location.sequence}
      data-card-position={ygopro.CardPosition[location.position]}
      data-card-position-value={location.position}
      data-card-is-overlay={location.is_overlay}
      data-card-overlay-animation={overlayAnimation ?? "none"}
      data-card-confirming={confirming}
      data-card-focusing={classFocus}
      data-card-shuffling={shuffling}
      data-card-details-visible={showDetails}
      data-card-overlay-sequence={location.overlay_sequence}
      data-card-is-token={snap.isToken}
      data-card-status={snap.status}
      data-card-selectable={snap.selectInfo.selectable}
      data-card-selected={snap.selectInfo.selected}
      data-card-targeted={snap.targeted}
      data-card-disabled={disabled}
      data-relation-active={relationActive}
      data-card-idle-actions={idleActions}
      data-card-idle-responses={idleActionResponses}
      data-card-idle-response-sources={idleActionSources}
      data-card-attack-directable={attackInteractivity?.directAttackAble}
      className={classnames(styles["mat-card"], {
        /* 有可操作选项或者已被选中*/
        [styles.glowing]: glowing || snap.selectInfo.selected,
        [styles.shining]: snap.selectInfo.selectable, // 可以被选中
        [styles["confirm-opponent-hand"]]:
          (confirming || classFocus || knownHand) &&
          location.zone === HAND &&
          !container.context.matStore.isMe(location.controller),
      })}
      style={
        {
          transform: to(
            [spring.x, spring.y, spring.rx, spring.rz, spring.height],
            (x, y, rx, rz, height) =>
              `translate(${x}px, ${y}px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${
                height / CARD_HEIGHT
              })`,
          ),
          zIndex: spring.zIndex,
          opacity: spring.opacity,
          visibility:
            (!showDetails && !showStack) ||
            (location.is_overlay && !overlayAnimation)
              ? "hidden"
              : "visible",
          pointerEvents: showStack || location.is_overlay ? "none" : undefined,
        } as any as CSSProperties
      }
      onClick={onClick}
      onMouseEnter={() => {
        fieldInspection.hovered = card.uuid;
      }}
      onMouseLeave={() => {
        if (fieldInspection.hovered === card.uuid)
          fieldInspection.hovered = null;
      }}
    >
      {showStack && (
        <animated.img
          data-testid="duel-stack-surface"
          className={styles["stack-surface"]}
          src={stackShowsBack ? backSrc : getCardImgUrl(stackCode)}
          alt=""
          aria-hidden
          draggable={false}
          decoding="async"
          style={{
            transform: to(
              [spring.z, spring.subZ],
              (z, subZ) =>
                `translateZ(${z + Math.min(subZ, 100 - subZ) * 4 + 0.1}px)`,
            ),
            objectFit: stackShowsBack ? "fill" : "contain",
          }}
          onError={(event) => {
            const defaultBack = getCardImgUrl(0, true);
            if (
              backSrc !== defaultBack &&
              event.currentTarget.getAttribute("src") === backSrc
            )
              event.currentTarget.src = defaultBack;
          }}
        />
      )}
      {showDetails && (
        <>
          <animated.div
            className={styles.focus}
            style={{
              transform: spring.focusScale.to((scale) => `scale(${scale})`),
              display: spring.focusDisplay,
              opacity: spring.focusOpacity,
            }}
          />
          <animated.div
            className={styles.shadow}
            style={{
              transform: spring.z.to((z) => `translateZ(${z + 0.1}px)`),
            }}
          />
          <Dropdown
            disabled={selecting}
            menu={dropdownMenu}
            placement="top"
            overlayClassName={classnames(styles.dropdown, {
              [styles["dropdown-disabled"]]: dropdownMenuDisabled,
            })}
            arrow
            trigger={["click"]}
          >
            <animated.div
              className={classnames(styles["img-wrap"], {
                [styles.focusing]: classFocus,
              })}
              style={{
                transform: to(
                  [spring.z, spring.subZ, spring.ry],
                  (z, subZ, ry) =>
                    `translateZ(${
                      z + Math.min(subZ, 100 - subZ) * 4 + 0.1
                    }px) rotateY(${
                      knownHand && !confirming && !classFocus ? 0 : ry
                    }deg)`,
                ),
              }}
            >
              <YgoCard
                className={styles.cover}
                code={snap.code === 0 ? snap.meta.id : snap.code}
                disabled={disabled}
                backSrc={backSrc}
              />
              <YgoCard className={styles.back} isBack backSrc={backSrc} />
              {previewSetCard && (
                <div
                  className={styles["set-preview"]}
                  data-testid="duel-set-card-preview"
                  data-card-code={snap.code}
                  aria-hidden
                >
                  <YgoCard code={snap.code} />
                </div>
              )}
            </animated.div>
          </Dropdown>
          <animated.div
            className={styles["chain-markers"]}
            style={{
              transform: to(
                [spring.rz, spring.z, spring.subZ],
                (rz, z, subZ) =>
                  `translate(-50%, -50%) translateZ(${
                    z + Math.min(subZ, 100 - subZ) * 4 + 4
                  }px) rotateZ(${-rz}deg)`,
              ),
            }}
          >
            <CardChainMarkers card={snap as CardType} focusing={classFocus} />
          </animated.div>
          <LinkArrows card={snap as CardType} />
          <animated.div
            className={styles["field-info-anchor"]}
            style={{
              transform: to(
                [spring.rz, spring.height],
                (rz, height) =>
                  `translate(-50%, -50%) rotateZ(${-rz}deg) scale(${
                    CARD_HEIGHT / Math.max(height, 1)
                  }) translateZ(2px)`,
              ),
            }}
          >
            <FieldCardInfo card={snap as CardType} />
          </animated.div>
          {snap.targeted ? <div className={styles.streamer} /> : <></>}
        </>
      )}
    </animated.div>
  );
});

// >>> 下拉菜单：点击动作 >>>
type DropdownItem = NonNullable<MenuProps["items"]>[number] & {
  onClick: () => void;
  "data-testid"?: string;
  "data-action-type"?: string;
};

// <<< 下拉菜单 <<<

const call =
  <Options,>(task: Task) =>
  (uuid: string, options?: Options extends undefined ? never : Options) =>
    eventbus.call(task, uuid, options);

export const callCardMove = call<MoveOptions>(Task.Move);
export const callCardFocus = call(Task.Focus);
export const callCardConfirm = call<ConfirmOptions>(Task.Confirm);
export const callCardShuffle = call<ShuffleOptions>(Task.Shuffle);
export const callCardAttack = call<AttackOptions>(Task.Attack);

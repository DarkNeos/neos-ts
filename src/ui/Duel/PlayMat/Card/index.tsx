import "./index.scss";

import { animated, to, useSpring } from "@react-spring/web";
import { Dropdown, type MenuProps } from "antd";
import classnames from "classnames";
import React, { type CSSProperties, useEffect, useState } from "react";
import { proxy, useSnapshot } from "valtio";

import { getCardStr, sendSelectIdleCmdResponse, ygopro } from "@/api";
import { useConfig } from "@/config";
import { eventbus, Task } from "@/infra";
import { cardStore, CardType, Interactivity, InteractType } from "@/stores";
import { showCardModal as displayCardModal } from "@/ui/Duel/Message/CardModal";
import { YgoCard } from "@/ui/Shared";

import {
  displayCardListModal,
  displayOptionModal,
  displaySimpleSelectCardsModal,
} from "../../Message";
import { interactTypeToString } from "../../utils";
import {
  attack,
  focus,
  moveToDeck,
  moveToGround,
  moveToHand,
  moveToOutside,
} from "./springs";
import type { SpringApiProps } from "./springs/types";
const NeosConfig = useConfig();

const { HAND, GRAVE, REMOVED, DECK, EXTRA, MZONE, SZONE, TZONE } =
  ygopro.CardZone;

export const Card: React.FC<{ idx: number }> = React.memo(({ idx }) => {
  const state = cardStore.inner[idx];
  const snap = useSnapshot(state);

  const [styles, api] = useSpring(
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
      } satisfies SpringApiProps)
  );

  const move = async (zone: ygopro.CardZone) => {
    switch (zone) {
      case MZONE:
      case SZONE:
        await moveToGround({ card: state, api });
        break;
      case HAND:
        await moveToHand({ card: state, api });
        break;
      case DECK:
      case EXTRA:
        await moveToDeck({ card: state, api });
        break;
      case GRAVE:
      case REMOVED:
        await moveToOutside({ card: state, api });
        break;
      case TZONE:
        // FIXME: 这里应该实现一个衍生物消散的动画，现在暂时让它在动画在展示上回到卡组
        await moveToDeck({ card: state, api });
        break;
    }
  };

  // 每张卡都需要移动到初始位置
  useEffect(() => {
    move(state.location.zone);
  }, []);

  const [highlight, setHighlight] = useState(false);
  const [classFocus, setClassFocus] = useState(false);
  // const [shadowOpacity, setShadowOpacity] = useState(0); // TODO: 透明度

  // >>> 动画 >>>
  /** 动画序列的promise */
  let animationQueue: Promise<unknown> = new Promise<void>((rs) => rs());

  const addToAnimation = (p: () => Promise<void>) =>
    new Promise((rs) => {
      animationQueue = animationQueue.then(p).then(rs);
    });

  useEffect(() => {
    eventbus.register(Task.Move, async (uuid: string) => {
      if (uuid === state.uuid) {
        await addToAnimation(() => move(state.location.zone));
      }
    });

    eventbus.register(Task.Focus, async (uuid: string) => {
      if (uuid === state.uuid) {
        await addToAnimation(async () => {
          setClassFocus(true);
          setTimeout(() => setClassFocus(false), 1000);
          await focus({ card: state, api });
        });
      }
    });

    eventbus.register(
      Task.Attack,
      async (
        uuid: string,
        directAttack: boolean,
        target?: ygopro.CardLocation
      ) => {
        if (uuid === state.uuid) {
          await addToAnimation(() =>
            attack({ card: state, api, target, directAttack })
          );
        }
      }
    );
  }, []);

  // <<< 动画 <<<

  // >>> 效果 >>>
  const idleInteractivities = snap.idleInteractivities;
  useEffect(() => {
    setHighlight(!!idleInteractivities.length);
  }, [idleInteractivities]);
  const onDropdownClick: MenuProps["onClick"] = ({ key }) => {
    const index = Number(key);
    dropdownMenu.value?.[index]?.onClick();
  };
  const menuItems = useSnapshot(dropdownMenu);
  // <<< 效果 <<<

  return (
    <animated.div
      className={classnames("mat-card", { highlight })}
      style={
        {
          transform: to(
            [styles.x, styles.y, styles.z, styles.rx, styles.ry, styles.rz],
            (x, y, z, rx, ry, rz) =>
              `translate(${x}px, ${y}px) rotateX(${rx}deg) rotateZ(${rz}deg)`
          ),
          "--z": styles.z,
          "--ry": styles.ry,
          height: styles.height,
          zIndex: styles.zIndex,
          "--focus-scale": styles.focusScale,
          "--focus-display": styles.focusDisplay,
          "--focus-opacity": styles.focusOpacity,
        } as any as CSSProperties
      }
      onClick={() => {
        if ([MZONE, SZONE, HAND].includes(state.location.zone)) {
          onCardClick(state);
        } else if ([EXTRA, GRAVE, REMOVED].includes(state.location.zone)) {
          onFieldClick(state);
        }
      }}
    >
      <div className="card-focus" />
      <div className="card-shadow" />
      <Dropdown
        menu={{ items: menuItems.value as any, onClick: onDropdownClick }}
        placement="bottom"
        overlayClassName="card-dropdown"
        arrow
        trigger={["click"]}
        // disabled={!highlight}
      >
        <div className={classnames("card-img-wrap", { focus: classFocus })}>
          <YgoCard
            className={classnames("card-cover")}
            code={snap.code === 0 ? snap.meta.id : snap.code}
          />
          <YgoCard className="card-back" isBack />
        </div>
      </Dropdown>
      {snap.selected ? <div className="card-streamer" /> : <></>}
    </animated.div>
  );
});

const onCardClick = (card: CardType) => {
  // 中央弹窗展示选中卡牌信息
  // TODO: 对方的卡片/未知的卡片，点击应该是没有效果的
  // TODO: 同一张卡片，是否重复点击会关闭CardModal？
  displayCardModal(card);
  handleDropdownMenu([card], false);

  // 侧边栏展示超量素材信息
  const overlayMaterials = cardStore.findOverlay(
    card.location.zone,
    card.location.controller,
    card.location.sequence
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
  handleDropdownMenu(cards, true);
};

// >>> 下拉菜单：点击动作 >>>
interface Interactivy {
  desc: string;
  response: number;
  effectCode: number | undefined;
}

type DropdownItem = NonNullable<MenuProps["items"]>[number] & {
  onClick: () => void;
};
const dropdownMenu = proxy({ value: [] as DropdownItem[] });

const handleEffectActivation = (
  effectInteractivies: Interactivy[],
  meta?: any // FIXME: meta的类型
) => {
  // 不用考虑为0的情况，因为已经判断了不可能为0
  if (effectInteractivies.length === 1) {
    // 如果只有一个效果，点击直接触发
    sendSelectIdleCmdResponse(effectInteractivies[0].response);
  } else {
    // optionsModal
    const options = effectInteractivies.map((effect) => {
      const effectMsg =
        meta && effect.effectCode
          ? getCardStr(meta, effect.effectCode & 0xf) ?? "[:?]"
          : "[:?]";
      return {
        msg: effectMsg,
        response: effect.response,
      };
    });
    displayOptionModal(options); // 主动发动效果，所以不需要await，但是以后可能要留心
  }
};

// 发动效果
// 1. 下拉菜单里面选择[召唤 / 特殊召唤 /.../效果发动]
// 2. 如果是非效果发动，那么直接选择哪张卡(单张卡直接选择那张)
// 3. 如果是效果发动，那么选择哪张卡，然后选择效果
const handleDropdownMenu = (cards: CardType[], isField: boolean) => {
  console.log("here");
  const map = new Map<Interactivity<number>["interactType"], CardType[]>();
  cards.forEach((card) => {
    card.idleInteractivities.forEach(({ interactType }) => {
      if (!map.has(interactType)) {
        map.set(interactType, []);
      }
      map.get(interactType)?.push(card);
    });
  });
  const actions = [...map.entries()];
  const nonEffectActions = actions.filter(
    ([action]) => action !== InteractType.ACTIVATE
  );
  const getNonEffectResponse = (action: InteractType, card: CardType) =>
    card.idleInteractivities.find((item) => item.interactType === action)!
      .response;
  const nonEffectItem: DropdownItem[] = nonEffectActions.map(
    ([action, cards], key) => ({
      key,
      label: interactTypeToString(action),
      onClick: async () => {
        if (!isField) {
          // 单卡: 直接召唤/特殊召唤/...
          const card = cards[0];
          sendSelectIdleCmdResponse(getNonEffectResponse(action, card));
        } else {
          // 场地: 选择卡片
          const option = await displaySimpleSelectCardsModal({
            selectables: cards.map((card) => ({
              meta: card.meta,
              location: card.location,
              response: getNonEffectResponse(action, card),
            })),
          });
          sendSelectIdleCmdResponse(option[0].response!);
        }
      },
    })
  );
  const hasEffect =
    cards.reduce(
      (prev, acc) => [
        ...prev,
        ...acc.idleInteractivities.filter(
          ({ interactType }) => interactType === InteractType.ACTIVATE
        ),
      ],
      [] as Interactivity<number>[]
    ).length > 0;
  const effectItem: DropdownItem = {
    key: nonEffectItem.length,
    label: interactTypeToString(InteractType.ACTIVATE),
    onClick: async () => {
      let card: CardType;
      if (!isField) {
        // 单卡: 直接发动这个卡的效果
        card = cards[0];
      } else {
        // 场地: 选择卡片
        const option = await displaySimpleSelectCardsModal({
          selectables: cards.map((card) => ({
            meta: card.meta,
            location: card.location,
            card,
          })),
        });
        card = option[0].card! as any; // 一定会有的，有输入则定有输出
      }
      // 选择发动哪个效果
      handleEffectActivation(
        card.idleInteractivities
          .filter(({ interactType }) => interactType === InteractType.ACTIVATE)
          .map((x) => ({
            desc: interactTypeToString(x.interactType),
            response: x.response,
            effectCode: x.activateIndex,
          })),
        card.meta
      );
    },
  };
  dropdownMenu.value = nonEffectItem;
  hasEffect && dropdownMenu.value.push(effectItem);
};
// <<< 下拉菜单 <<<

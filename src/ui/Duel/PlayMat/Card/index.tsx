import "./index.scss";

import {
  DownloadOutlined,
  UploadOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { animated, to, useSpring } from "@react-spring/web";
import { Button, Dropdown, type MenuProps } from "antd";
import classnames from "classnames";
import React, { type CSSProperties, type FC, useEffect, useState } from "react";
import { proxy, useSnapshot } from "valtio";

import { getCardStr, ygopro } from "@/api";
import { type CardMeta, fetchStrings, sendSelectIdleCmdResponse } from "@/api";
import { useConfig } from "@/config";
import { eventbus, Task } from "@/infra";
import { cardStore, CardType, messageStore } from "@/stores";
import {
  closeCardModal,
  showCardModal as displayCardModal,
} from "@/ui/Duel/Message/CardModal";
import { YgoCard } from "@/ui/Shared";

import { displayCardListModal, displayOptionModal } from "../../Message";
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

export const Card: FC<{ idx: number }> = React.memo(({ idx }) => {
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

  // 这里后期应该去掉？
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
        disabled={!highlight}
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
  displaySingleCardDropdown(card);

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
  // TODO: 收集这个zone的所有交互，并且在下拉菜单之中显示
  const cards = cardStore.at(card.location.zone, card.location.controller);
  // 所有的交互进行聚类
  const interactivities = cards.map((card) => card.idleInteractivities);
  // 构建新的dropdownMenu
  // 发动效果 -> 发动哪张卡？(卡选择) -> 效果选择
  // 召唤、特殊召唤同理
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

const displaySingleCardDropdown = (card: CardType) => {
  const interactivies = card.idleInteractivities.map((interactivity) => ({
    desc: interactTypeToString(interactivity.interactType),
    response: interactivity.response,
    effectCode: interactivity.activateIndex,
  }));
  const EFFECT_ACTIVATION_DESC = "发动效果";
  const nonEffectInteractivies = interactivies.filter(
    (item) => item.desc !== EFFECT_ACTIVATION_DESC
  );
  const effectInteractivies = interactivies.filter(
    (item) => item.desc === EFFECT_ACTIVATION_DESC
  );
  dropdownMenu.value = nonEffectInteractivies.map(
    ({ desc, response }, key) => ({
      key,
      label: desc,
      onClick: () => sendSelectIdleCmdResponse(response),
    })
  );
  if (effectInteractivies.length) {
    dropdownMenu.value.push({
      key: dropdownMenu.value.length,
      label: EFFECT_ACTIVATION_DESC,
      onClick: () => handleEffectActivation(effectInteractivies, card.meta),
    });
  }
};

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
// <<< 下拉菜单 <<<

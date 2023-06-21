import "./index.scss";

import { animated, to, useSpring } from "@react-spring/web";
import classnames from "classnames";
import React, { type CSSProperties, type FC, useEffect, useState } from "react";
import { useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { useConfig } from "@/config";
import { eventbus, Task } from "@/infra";
import { cardStore, CardType, messageStore } from "@/stores";

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

import { YgoCard } from "@/ui/Shared";
import { showCardModal } from "@/ui/Duel/Message/CardModal";

import { Button, Dropdown } from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  UpOutlined,
} from "@ant-design/icons";

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

  const idleInteractivities = snap.idleInteractivities;
  useEffect(() => {
    setHighlight(!!idleInteractivities.length);
  }, [idleInteractivities]);
  const items = [
    {
      key: "1",
      label: "正面攻表召唤",
    },
    {
      key: "2",
      label: "反面守表召唤",
    },
    {
      key: "3",
      label: "效果发动",
    },
  ];
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
        menu={{ items }}
        placement="bottom"
        overlayClassName="card-dropdown"
        arrow={{ pointAtCenter: true }}
        trigger={["click"]}
      >
        <div className={classnames("card-img-wrap", { focus: classFocus })}>
          <YgoCard
            className={classnames("card-cover")}
            code={snap.code === 0 ? snap.meta.id : snap.code}
          />
          <YgoCard className="card-back" isBack />
        </div>
      </Dropdown>
    </animated.div>
  );
});

const onCardClick = (card: CardType) => {
  // 中央弹窗展示选中卡牌信息
  // TODO: 对方的卡片/未知的卡片，点击应该是没有效果的
  // TODO: 同一张卡片，是否重复点击会关闭CardModal？
  showCardModal(card);

  // 侧边栏展示超量素材信息
  const overlayMaterials = cardStore.findOverlay(
    card.location.zone,
    card.location.controller,
    card.location.sequence
  );
  if (overlayMaterials.length > 0) {
    messageStore.cardListModal.list =
      overlayMaterials.map((overlay) => ({
        meta: {
          id: overlay.code,
          text: overlay.meta.text,
          data: overlay.meta.data,
        },
        interactivies: [],
      })) || [];
    messageStore.cardListModal.isOpen = true;
  }
};

const onFieldClick = (card: CardType) => {
  const displayStates = cardStore.at(
    card.location.zone,
    card.location.controller
  );
  messageStore.cardListModal.list = displayStates.map((item) => ({
    meta: {
      id: item.code,
      text: item.meta.text,
      data: item.meta.data,
    },
    interactivies: item.idleInteractivities.map((interactivy) => ({
      desc: interactTypeToString(interactivy.interactType),
      response: interactivy.response,
    })),
  }));
  messageStore.cardListModal.isOpen = true;
};

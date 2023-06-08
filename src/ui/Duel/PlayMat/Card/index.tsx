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
  focus,
  moveToDeck,
  moveToGround,
  moveToHand,
  moveToOutside,
} from "./springs";

const NeosConfig = useConfig();

const { HAND, GRAVE, REMOVED, DECK, EXTRA, MZONE, SZONE, TZONE } =
  ygopro.CardZone;

export const Card: FC<{ idx: number }> = React.memo(({ idx }) => {
  const state = cardStore.inner[idx];
  const snap = useSnapshot(state);

  const [styles, api] = useSpring(() => ({
    x: 0,
    y: 0,
    z: 0,
    rx: 0,
    ry: 0,
    rz: 0,
    zIndex: 0,
    height: 0,
  }));

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

  useEffect(() => {
    move(state.location.zone);
  }, []);

  const [highlight, setHighlight] = useState(false);
  // const [shadowOpacity, setShadowOpacity] = useState(0); // TODO: 透明度

  // >>> 动画 >>>
  /** 动画序列的promise */
  let animationQueue: Promise<unknown> = new Promise<void>((rs) => rs());

  const addToAnimation = (p: () => Promise<void>) =>
    new Promise((rs) => {
      animationQueue = animationQueue.then(p).then(rs);
    });

  eventbus.register(Task.Move, async (uuid: string) => {
    if (uuid === state.uuid) {
      await addToAnimation(() => move(state.location.zone));
    }
  });

  eventbus.register(Task.Focus, async (uuid: string) => {
    if (uuid === state.uuid) {
      await addToAnimation(() => focus({ card: state, api }));
    }
  });
  // <<< 动画 <<<

  useEffect(() => {
    setHighlight(!!snap.idleInteractivities.length);
  }, [snap.idleInteractivities.length]);

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
      <div className="card-shadow" />
      <div className="card-img-wrap">
        <img
          className="card-cover"
          onError={() => {
            console.log("");
          }}
          src={getCardImgUrl(snap.code == 0 ? snap.meta.id : snap.code)}
        />
        <img className="card-back" src={getCardImgUrl(0, true)} />
      </div>
    </animated.div>
  );
});

function getCardImgUrl(code: number, back = false) {
  const ASSETS_BASE =
    import.meta.env.BASE_URL == "/"
      ? NeosConfig.assetsPath
      : import.meta.env.BASE_URL + NeosConfig.assetsPath;
  if (code === 0 || back) {
    return ASSETS_BASE + "/card_back.jpg";
  }
  return NeosConfig.cardImgUrl + "/" + code + ".jpg";
}

const onCardClick = (card: CardType) => {
  // 中央弹窗展示选中卡牌信息
  messageStore.cardModal.meta = {
    id: card.code,
    text: card.meta.text,
    data: card.meta.data,
  };
  messageStore.cardModal.interactivies = card.idleInteractivities.map(
    (interactivity) => ({
      desc: interactTypeToString(interactivity.interactType),
      response: interactivity.response,
      effectCode: interactivity.activateIndex,
    })
  );
  messageStore.cardModal.counters = card.counters;
  messageStore.cardModal.isOpen = true;

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

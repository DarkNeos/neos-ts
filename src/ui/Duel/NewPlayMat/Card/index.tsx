import React, { useEffect, type CSSProperties, type FC } from "react";
import { cardStore, messageStore, CardType } from "@/stores";
import "./index.scss";
import { useSnapshot } from "valtio";
import { watch } from "valtio/utils";
import { useSpring, animated, to } from "@react-spring/web";
import { ygopro } from "@/api";
import { useConfig } from "@/config";
import { moveToDeck, moveToField, moveToHand, moveToOutside } from "./springs";
import { ReportEnum } from "./springs/types";
import { interactTypeToString } from "../../utils";

const NeosConfig = useConfig();

const { HAND, GRAVE, REMOVED, DECK, EXTRA, MZONE, SZONE, TZONE, OVERLAY } =
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

  const reload = (zone: ygopro.CardZone, report: boolean) => {
    switch (zone) {
      case MZONE:
      case SZONE:
      case OVERLAY:
        moveToField({ card: state, api, report });
        break;
      case HAND:
        moveToHand({ card: state, api, report });
        break;
      case DECK:
      case EXTRA:
        moveToDeck({ card: state, api, report });
        break;
      case GRAVE:
      case REMOVED:
        moveToOutside({ card: state, api, report });
        break;
    }
  };
  useEffect(() => {
    reload(state.zone, false);
  }, []);

  watch((get) => {
    const { zone, sequence, controller, xyzMonster } = get(state);
    reload(zone, true);
  });

  // 在别的手卡更改时候，刷新这张手卡
  eventBus.on(
    ReportEnum.ReloadHand,
    ({ sequence, controller }: { sequence: number; controller: number }) => {
      if (state.sequence !== sequence && state.controller === controller) {
        reload(state.zone, false);
      }
    }
  );

  return (
    <animated.div
      className="mat-card"
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
        } as any as CSSProperties
      }
      onClick={() =>
        [MZONE, SZONE, HAND].includes(state.zone) && onCardClick(state)
      }
    >
      <div className="card-img-wrap">
        <img className="card-cover" src={getCardImgUrl(snap.code)} alt="" />
        <img className="card-back" src={getCardImgUrl(0, true)} alt="" />
      </div>
      <div className="card-shadow" />
    </animated.div>
  );
});

function getCardImgUrl(code: number, back = false) {
  const ASSETS_BASE =
    import.meta.env.BASE_URL == "/"
      ? NeosConfig.assetsPath
      : import.meta.env.BASE_URL + NeosConfig.assetsPath;
  if (back) {
    return ASSETS_BASE + "/card_back.jpg";
  }
  return NeosConfig.cardImgUrl + "/" + code + ".jpg";
}

const onCardClick = (card: CardType) => () => {
  // 中央弹窗展示选中卡牌信息
  messageStore.cardModal.meta = {
    id: card.code,
    text: card.text,
    data: card.data,
  };
  messageStore.cardModal.interactivies = card.idleInteractivities.map(
    (interactivity) => ({
      desc: interactTypeToString(interactivity.interactType),
      response: interactivity.response,
    })
  );
  messageStore.cardModal.counters = card.counters;
  messageStore.cardModal.isOpen = true;

  // 侧边栏展示超量素材信息
  if (card.overlayMaterials.length > 0) {
    messageStore.cardListModal.list =
      card.overlayMaterials.map((overlay) => ({
        meta: {
          id: overlay.code,
          text: overlay.text,
          data: overlay.data,
        },
        interactivies: [],
      })) || [];
    messageStore.cardListModal.isOpen = true;
  }
};

import availableArt from "neos-filed/artwork/manifest.json";
import { useState } from "react";
import { useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { duelAssetUrl } from "@/api/duelAssets";
import { useConfig } from "@/config";
import { cardStore, matStore } from "@/stores";
import { settingStore } from "@/stores/settingStore";

import styles from "./index.module.scss";

// 清单和图片固定在同一个子模块提交，避免更新素材时只更新其中一项。
const available = new Set(availableArt);

export const FieldArtwork = () => {
  const { inner } = useSnapshot(cardStore);
  useSnapshot(matStore).selfType;
  const { duel } = useSnapshot(settingStore);
  if (!duel.fieldArtwork) return null;
  return (
    <>
      {inner
        .filter(
          (card) =>
            card.location.zone === ygopro.CardZone.SZONE &&
            card.location.sequence === 5 &&
            !card.location.is_overlay &&
            [
              ygopro.CardPosition.FACEUP,
              ygopro.CardPosition.FACEUP_ATTACK,
              ygopro.CardPosition.FACEUP_DEFENSE,
            ].includes(card.location.position) &&
            card.code > 0,
        )
        .map((card) => (
          <FieldImage
            key={`${card.uuid}-${card.code}`}
            code={card.code}
            player={matStore.isMe(card.location.controller) ? "me" : "op"}
          />
        ))}
    </>
  );
};

const FieldImage = ({
  code,
  player,
}: {
  code: number;
  player: "me" | "op";
}) => {
  // 与 ygopro2_unity2021 一致，只下载专用场地图，不用普通卡图替代。
  const remote = `${useConfig().releaseResource.img}/field/${code}.jpg`;
  const [source, setSource] = useState(
    available.has(code) ? duelAssetUrl(`fields/${code}.webp`) : remote,
  );
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    <img
      className={styles.artwork}
      data-testid="duel-field-artwork"
      data-card-code={code}
      data-player={player}
      src={source}
      alt=""
      draggable={false}
      onError={() => {
        if (source !== remote) setSource(remote);
        else setMissing(true);
      }}
    />
  );
};

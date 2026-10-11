import { useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { cardStore, matStore } from "@/stores";

import styles from "./index.module.scss";

const zones = [
  { zone: ygopro.CardZone.DECK, name: "主卡组" },
  { zone: ygopro.CardZone.EXTRA, name: "额外卡组" },
  { zone: ygopro.CardZone.GRAVE, name: "墓地" },
  { zone: ygopro.CardZone.REMOVED, name: "除外" },
];

export const ZoneCounts = () => {
  const { inner } = useSnapshot(cardStore);
  const { selfType } = useSnapshot(matStore);
  const ownController =
    selfType === ygopro.StocTypeChange.SelfType.PLAYER2 ? 1 : 0;

  return (
    <div className={styles.counts}>
      {[0, 1].map((controller) => {
        const own = controller === ownController;
        return (
          <div key={controller} data-player={own ? "me" : "op"}>
            {zones.map(({ zone, name }) => {
              const count = inner.filter(
                ({ location }) =>
                  location.controller === controller &&
                  location.zone === zone &&
                  !location.is_overlay,
              ).length;
              return (
                <span
                  key={zone}
                  className={styles.number}
                  data-testid="duel-zone-count"
                  data-controller={controller}
                  data-zone={ygopro.CardZone[zone]}
                  data-empty={count === 0}
                  aria-label={`${own ? "我方" : "对方"}${name} ${count} 张`}
                >
                  {count}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

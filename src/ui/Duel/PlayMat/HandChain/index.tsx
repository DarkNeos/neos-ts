import { type INTERNAL_Snapshot as Snapshot, useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { BlockState, placeStore } from "@/stores";
import { BgChain } from "@/ui/Shared";

import styles from "./index.module.scss";

const { HAND } = ygopro.CardZone;

export const HandChain: React.FC = () => {
  const snap = useSnapshot(placeStore.inner);
  const me = snap[HAND].me;
  const op = snap[HAND].op;

  const genChains = (states: Snapshot<BlockState[]>) => {
    const chains: number[] = states.flatMap((state) => state.chainIndex);
    chains.sort();

    return chains;
  };

  return (
    <div className={styles.container}>
      <div className={styles.me}>
        <BgChain chains={genChains(me)} />
      </div>
      <div className={styles.op}>
        <BgChain chains={genChains(op)} op />
      </div>
    </div>
  );
};

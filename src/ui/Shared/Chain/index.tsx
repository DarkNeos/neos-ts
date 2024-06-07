import classnames from "classnames";

import { useConfig } from "@/config";

import styles from "./index.module.scss";

const { assetsPath } = useConfig();

export interface ChainProps {
  chains: readonly number[];
  nBelow?: number; // 浮在该区域最上方一张卡的上面，需要感知有多少卡
  op?: boolean;
}

/* 这里有个妥协的实现：墓地，除外区，额外卡组的连锁图标会被卡片遮挡，原因不明,
 * 因此这里暂时采取移动一个身位的方式进行解决。最好的解决方案应该是UI上连锁图标和
 * 场地解耦。 */
export const BgChain: React.FC<ChainProps> = ({
  chains,
  nBelow: nCardsBelow = 1,
  op,
}) => (
  <div
    className={classnames(styles.container, {
      [styles.op]: op,
    })}
    style={{
      // @ts-ignore
      "--n": nCardsBelow,
    }}
  >
    {/* 暂时只适配最后的连锁，不然肯定会出现错位 */}
    {!!chains.length &&
      [Math.max(...chains)].map((chain) => (
        <div className={styles.chain} key={chain}>
          <img src={`${assetsPath}/chain.png`} />
          <div className={styles.text}>{chain}</div>
        </div>
      ))}
  </div>
);

import classnames from "classnames";
import type { HTMLAttributes } from "react";

import { useConfig } from "@/config";

import styles from "./index.module.scss";

const { assetsPath } = useConfig();

export const ChainIcon = ({
  index,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { index: number }) => (
  <span {...props} className={classnames(styles.chain, className)}>
    <img src={`${assetsPath}/chain.png`} alt="" />
    <span className={styles.text}>{index}</span>
  </span>
);

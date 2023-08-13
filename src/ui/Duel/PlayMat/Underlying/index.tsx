import classNames from "classnames";
import { useSnapshot } from "valtio";

import { isMe, matStore } from "@/stores";
import { withPortalToBody } from "@/ui/Shared";

import styles from "./index.module.scss";

export const Underlying: React.FC<{}> = withPortalToBody(() => {
  const { currentPlayer } = useSnapshot(matStore);
  return (
    <div
      className={classNames(styles.background, {
        [styles.opponent]: !isMe(currentPlayer),
      })}
    >
      <div className={styles.inner}></div>
    </div>
  );
});

import { cardStore } from "@/stores";

import { Bg } from "../Bg";
import { Card } from "../Card";
import styles from "./index.module.scss";

// 后面再改名
export const Mat: React.FC = () => {
  return (
    <section className={styles.mat}>
      <div className={styles.camera}>
        <div className={styles.plane}>
          <Bg />
          <div className={styles.container}>
            <Cards />
          </div>
        </div>
      </div>
    </section>
  );
};

const Cards: React.FC = () => {
  const length = cardStore.inner.length;
  return (
    <>
      {Array.from({ length }).map((_, i) => (
        <Card key={i} idx={i} />
      ))}
    </>
  );
};

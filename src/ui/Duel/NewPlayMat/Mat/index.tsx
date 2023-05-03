import type { FC, PropsWithChildren } from "react";
import "./index.scss";

import { Bg } from "../Bg";
import { Card } from "../Card";

import { type CSSConfig, toCssProperties, matConfig } from "../utils";

import { cardStore } from "@/stores";
import { useSnapshot } from "valtio";

// 后面再改名
export const Mat: FC = () => {
  const snap = useSnapshot(cardStore.inner);
  return (
    <section
      id="mat"
      style={{
        width: "100%",
        ...toCssProperties(matConfig),
      }}
    >
      <Plane>
        <Bg />
        {snap.map((cardSnap, i) => (
          <Card key={i} idx={i} />
        ))}
      </Plane>
    </section>
  );
};

const Plane: FC<PropsWithChildren> = ({ children }) => (
  <div id="camera">
    <div id="plane">{children}</div>
  </div>
);

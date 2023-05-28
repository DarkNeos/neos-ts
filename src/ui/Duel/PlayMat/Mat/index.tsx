import "./index.scss";

import type { FC, PropsWithChildren } from "react";
import { useSnapshot } from "valtio";

import { cardStore } from "@/stores";

import { Bg } from "../Bg";
import { Card } from "../Card";
import { type CSSConfig, matConfig, toCssProperties } from "../utils";

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
        <CardContainer>
          {snap.map((cardSnap, i) => (
            <Card key={i} idx={i} />
          ))}
        </CardContainer>
      </Plane>
    </section>
  );
};

const Plane: FC<PropsWithChildren> = ({ children }) => (
  <div id="camera">
    <div id="plane">{children}</div>
  </div>
);

const CardContainer: FC<PropsWithChildren> = ({ children }) => (
  <div className="mat-card-container">{children}</div>
);

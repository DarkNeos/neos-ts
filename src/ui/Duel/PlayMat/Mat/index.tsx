import "./index.scss";

import { useSnapshot } from "valtio";

import { cardStore } from "@/stores";

import { Bg } from "../Bg";
import { Card } from "../Card";

// 后面再改名
export const Mat: React.FC = () => {
  const snap = useSnapshot(cardStore.inner);
  return (
    <section
      id="mat"
      style={{
        width: "100%",
      }}
    >
      <Plane>
        <Bg />
        <CardContainer>
          {snap.map((_cardSnap, i) => (
            <Card key={i} idx={i} />
          ))}
        </CardContainer>
      </Plane>
    </section>
  );
};

const Plane: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div id="camera">
    <div id="plane">{children}</div>
  </div>
);

const CardContainer: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="mat-card-container">{children}</div>
);

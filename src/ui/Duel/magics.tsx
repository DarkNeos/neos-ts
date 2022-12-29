import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";

// TODO: use config
const left = -2.15;
const gap = 1.05;

const Magics = () => {
  return (
    <>
      {[0, 1, 2, 3, 4].map((idx) => {
        return <Magic idx={idx} />;
      })}
    </>
  );
};

const Magic = (props: { idx: number }) => {
  const shape = CONFIG.CardSlotShape();
  const position = new BABYLON.Vector3(
    left + gap * props.idx,
    shape.depth / 2 + CONFIG.Floating,
    -2.6
  );
  const rotation = CONFIG.CardSlotRotation();

  return (
    <plane
      name={`magic-${props.idx}`}
      width={shape.width}
      height={shape.height}
      position={position}
      rotation={rotation}
    >
      <standardMaterial
        name={`magic-mat-${props.idx}`}
        diffuseTexture={
          new BABYLON.Texture(`http://localhost:3030/images/card_slot.png`)
        }
        alpha={0.2}
      ></standardMaterial>
    </plane>
  );
};

export default Magics;

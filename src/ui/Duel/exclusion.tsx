import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";

const Exclusion = () => {
  const shape = CONFIG.ExclusionSlotShape();
  const position = new BABYLON.Vector3(3.2, CONFIG.Floating, -0.7);
  const rotation = CONFIG.ExclusionSlotRotation();

  return (
    <box
      name="exclusion"
      width={shape.width}
      height={shape.height}
      depth={shape.depth}
      position={position}
      rotation={rotation}
    >
      <standardMaterial
        name="exclusion-mat"
        diffuseColor={CONFIG.ExclusionColor()}
      ></standardMaterial>
    </box>
  );
};

export default Exclusion;

import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";

const Cemetery = () => {
  const shape = CONFIG.CemeterySlotShape();
  const position = new BABYLON.Vector3(
    3.2,
    shape.depth / 2 + CONFIG.Floating,
    -2.0
  );
  const rotation = CONFIG.CemeterySlotRotation();

  return (
    <box
      name="cemetery"
      width={shape.width}
      height={shape.height}
      depth={shape.depth}
      position={position}
      rotation={rotation}
    >
      <standardMaterial
        name="cemetery-mat"
        diffuseColor={CONFIG.CemeteryColor()}
      />
    </box>
  );
};

export default Cemetery;

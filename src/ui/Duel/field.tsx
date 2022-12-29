import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";

const Field = () => {
  const shape = CONFIG.FieldSlotShape();
  const position = new BABYLON.Vector3(
    -3.3,
    shape.depth / 2 + CONFIG.Floating,
    -2.0
  );
  const rotation = CONFIG.FieldSlotRotation();

  return (
    <box
      name="field"
      width={shape.width}
      height={shape.height}
      depth={shape.depth}
      position={position}
      rotation={rotation}
    >
      <standardMaterial name="field-mat" diffuseColor={CONFIG.FieldColor()} />
    </box>
  );
};

export default Field;

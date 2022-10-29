// 测试用的Babylon.js demo页面
import React, { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";

export default function () {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvasCurrent = canvasRef.current;
      const engine = new BABYLON.Engine(canvasCurrent, true);
      const scene = new BABYLON.Scene(engine);

      const camera = new BABYLON.FreeCamera(
        "camera1",
        new BABYLON.Vector3(0, 5, -10),
        scene
      );
      camera.setTarget(BABYLON.Vector3.Zero());
      camera.attachControl(canvasCurrent, true);

      const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 0),
        scene
      );
      light.intensity = 0.7;

      const sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere",
        { diameter: 2, segments: 32 },
        scene
      );
      sphere.position.y = 1;

      const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        { width: 6, height: 6 },
        scene
      );

      engine.runRenderLoop(() => {
        scene.render();
      });
    }
  }, [canvasRef]);

  return <canvas ref={canvasRef} />;
}

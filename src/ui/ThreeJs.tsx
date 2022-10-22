import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export default function ThreeJs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
      const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 5);
      const scene = new THREE.Scene();

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x44aa88 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(-1, 2, 4);
      scene.add(light);

      camera.position.z = 2;

      const render = (time: number) => {
        time = time * 0.001;
        cube.rotation.x = time;
        cube.rotation.y = time;
        renderer.render(scene, camera);
        window.requestAnimationFrame(render);
      };
      window.requestAnimationFrame(render);
    }
  }, [canvasRef]);

  return <canvas ref={canvasRef} />;
}

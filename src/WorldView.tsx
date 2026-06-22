import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Level, RunResult, TraceEntry } from "./types";

type WorldViewProps = {
  level: Level;
  runResult: RunResult;
};

const tileSize = 1.15;
const stepDurationMs = 420;

export default function WorldView({ level, runResult }: WorldViewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#101722");

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(3.8, 5.2, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight("#dcecff", "#26331f", 1.4);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight("#ffffff", 2.2);
    sun.position.set(3, 6, 4);
    sun.castShadow = true;
    scene.add(sun);

    const board = new THREE.Group();
    scene.add(board);

    const tileGeometry = new THREE.BoxGeometry(tileSize, 0.14, tileSize);
    const soilMaterial = new THREE.MeshStandardMaterial({
      color: "#30472f",
      roughness: 0.85,
    });
    const alternateMaterial = new THREE.MeshStandardMaterial({
      color: "#385537",
      roughness: 0.85,
    });

    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        const tile = new THREE.Mesh(
          tileGeometry,
          (x + y) % 2 === 0 ? soilMaterial : alternateMaterial,
        );
        tile.position.copy(worldPosition(level, x, y));
        tile.receiveShadow = true;
        board.add(tile);
      }
    }

    const goal = createGoalMarker();
    goal.position.copy(worldPosition(level, level.goal.x, level.goal.y));
    goal.position.y = 0.36;
    scene.add(goal);

    const farmer = createFarmer();
    farmer.position.copy(worldPosition(level, level.start.x, level.start.y));
    farmer.position.y = 0.46;
    scene.add(farmer);

    const path = toPath(level, runResult.trace);
    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    let frame = 0;
    let startTime = performance.now();

    const animate = (time: number) => {
      resize();
      const elapsed = time - startTime;
      const segment = Math.min(
        Math.floor(elapsed / stepDurationMs),
        Math.max(path.length - 2, 0),
      );
      const progress = Math.min((elapsed % stepDurationMs) / stepDurationMs, 1);
      const eased = easeInOut(progress);
      const from = path[segment] ?? path[0];
      const to = path[segment + 1] ?? from;

      farmer.position.lerpVectors(from, to, eased);
      farmer.position.y = 0.46 + Math.sin(time / 140) * 0.03;
      farmer.rotation.y = Math.sin(time / 500) * 0.08;
      goal.rotation.y += 0.025;

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      tileGeometry.dispose();
      soilMaterial.dispose();
      alternateMaterial.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [level, runResult.trace]);

  return <div ref={hostRef} className="worldCanvas" aria-label="Animated level world" />;
}

function createFarmer() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.58, 0.36),
    new THREE.MeshStandardMaterial({ color: "#68e1fd", roughness: 0.45 }),
  );
  body.castShadow = true;
  group.add(body);

  const hat = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.1, 0.5),
    new THREE.MeshStandardMaterial({ color: "#f4c95d", roughness: 0.75 }),
  );
  hat.position.y = 0.36;
  hat.castShadow = true;
  group.add(hat);

  return group;
}

function createGoalMarker() {
  const group = new THREE.Group();

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.5, 12),
    new THREE.MeshStandardMaterial({ color: "#80d37b", roughness: 0.65 }),
  );
  stem.castShadow = true;
  group.add(stem);

  const crop = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 18, 18),
    new THREE.MeshStandardMaterial({
      color: "#ffcf5c",
      emissive: "#533700",
      emissiveIntensity: 0.18,
      roughness: 0.5,
    }),
  );
  crop.position.y = 0.32;
  crop.castShadow = true;
  group.add(crop);

  return group;
}

function toPath(level: Level, trace: TraceEntry[]) {
  return [
    worldPosition(level, level.start.x, level.start.y).setY(0.46),
    ...trace.map((entry) =>
      worldPosition(level, entry.state.x, entry.state.y).setY(0.46),
    ),
  ];
}

function worldPosition(level: Level, x: number, y: number) {
  return new THREE.Vector3(
    (x - (level.width - 1) / 2) * tileSize,
    0,
    ((level.height - 1) / 2 - y) * tileSize,
  );
}

function easeInOut(value: number) {
  return value < 0.5 ? 2 * value * value : 1 - (-2 * value + 2) ** 2 / 2;
}

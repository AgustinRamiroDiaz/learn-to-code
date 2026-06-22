import { useEffect, useRef } from "react";
import * as THREE from "three";
import type {
  GridLevel,
  Level,
  RunResult,
  StructureLevel,
  TraceEntry,
  TraversalLevel,
  TreeNodeData,
} from "./types";

type WorldViewProps = {
  level: Level;
  runResult: RunResult;
};

type StructureSnapshot = {
  items: string[];
  processed: string[];
};

type TraversalSnapshot = {
  current?: string;
  visited: string[];
};

const tileSize = 1.15;
const stepDurationMs = 420;

const itemColors: Record<string, string> = {
  ada: "#68e1fd",
  bea: "#f4c95d",
  cosmo: "#b28dff",
  seed: "#80d37b",
  soil: "#9f7e5a",
  water: "#4fb4ff",
};

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

    addLights(scene);

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    const runAnimation =
      level.kind === "grid"
        ? createGridAnimation(scene, camera, level, runResult.trace)
        : level.kind === "stack" || level.kind === "queue"
          ? createStructureAnimation(scene, camera, level, runResult.trace)
          : createTraversalAnimation(scene, camera, level, runResult.trace);

    let frame = 0;
    const startTime = performance.now();

    const animate = (time: number) => {
      resize();
      runAnimation(time, time - startTime);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      disposeObject(scene);
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [level, runResult.trace]);

  return <div ref={hostRef} className="worldCanvas" aria-label="Animated level world" />;
}

function addLights(scene: THREE.Scene) {
  const ambient = new THREE.HemisphereLight("#dcecff", "#26331f", 1.4);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight("#ffffff", 2.2);
  sun.position.set(3, 6, 4);
  sun.castShadow = true;
  scene.add(sun);
}

function createGridAnimation(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  level: GridLevel,
  trace: TraceEntry[],
) {
  camera.position.set(3.8, 5.2, 6.2);
  camera.lookAt(0, 0, 0);

  const board = new THREE.Group();
  scene.add(board);

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
        new THREE.BoxGeometry(tileSize, 0.14, tileSize),
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

  const path = toPath(level, trace);

  return (time: number, elapsed: number) => {
    const segmentCount = Math.max(path.length - 1, 0);
    const totalDuration = segmentCount * stepDurationMs;
    const playbackTime = Math.min(elapsed, totalDuration);
    const segment = Math.min(
      Math.floor(playbackTime / stepDurationMs),
      Math.max(segmentCount - 1, 0),
    );
    const segmentElapsed = Math.min(
      playbackTime - segment * stepDurationMs,
      stepDurationMs,
    );
    const progress = segmentCount === 0 ? 1 : segmentElapsed / stepDurationMs;
    const from = path[segment] ?? path[0];
    const to = path[segment + 1] ?? from;

    if (elapsed >= totalDuration) {
      farmer.position.copy(path[path.length - 1] ?? path[0]);
    } else {
      farmer.position.lerpVectors(from, to, easeInOut(progress));
    }

    farmer.position.y = 0.46 + Math.sin(time / 140) * 0.03;
    farmer.rotation.y = Math.sin(time / 500) * 0.08;
    goal.rotation.y += 0.025;
  };
}

function createStructureAnimation(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  level: StructureLevel,
  trace: TraceEntry[],
) {
  camera.position.set(0, 4.8, 6.8);
  camera.lookAt(0, 0.4, 0);
  addStructureStage(scene, level);

  const dynamic = new THREE.Group();
  scene.add(dynamic);

  const snapshots = toStructureSnapshots(level, trace);
  let activeIndex = -1;

  return (time: number, elapsed: number) => {
    const index = Math.min(
      Math.floor(elapsed / stepDurationMs),
      Math.max(snapshots.length - 1, 0),
    );

    if (index !== activeIndex) {
      activeIndex = index;
      clearGroup(dynamic);
      if (level.kind === "stack") {
        renderStackSnapshot(dynamic, snapshots[index]);
      } else {
        renderQueueSnapshot(dynamic, snapshots[index]);
      }
    }

    dynamic.position.y = Math.sin(time / 180) * 0.025;
  };
}

function createTraversalAnimation(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  level: TraversalLevel,
  trace: TraceEntry[],
) {
  camera.position.set(0, 5.2, 7.4);
  camera.lookAt(0, 0.25, 0);

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 0.1, 3.5),
    new THREE.MeshStandardMaterial({ color: "#202b38", roughness: 0.82 }),
  );
  floor.position.y = -0.08;
  floor.receiveShadow = true;
  scene.add(floor);

  const dynamic = new THREE.Group();
  scene.add(dynamic);

  const snapshots = toTraversalSnapshots(trace);
  let activeIndex = -1;

  return (time: number, elapsed: number) => {
    const index = Math.min(
      Math.floor(elapsed / stepDurationMs),
      Math.max(snapshots.length - 1, 0),
    );

    if (index !== activeIndex) {
      activeIndex = index;
      clearGroup(dynamic);
      if (level.kind === "matrix") {
        renderMatrixSnapshot(dynamic, level, snapshots[index]);
      } else {
        renderTreeSnapshot(dynamic, level.tree, snapshots[index]);
      }
    }

    dynamic.rotation.y = Math.sin(time / 1100) * 0.04;
  };
}

function addStructureStage(scene: THREE.Scene, level: StructureLevel) {
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.12, 3.2),
    new THREE.MeshStandardMaterial({ color: "#24303f", roughness: 0.8 }),
  );
  floor.position.y = -0.07;
  floor.receiveShadow = true;
  scene.add(floor);

  if (level.kind === "stack") {
    const pallet = createPlatform("#5d4b37");
    pallet.position.set(-1.45, 0.05, 0);
    scene.add(pallet);

    const cart = createPlatform("#355d4b");
    cart.position.set(1.35, 0.05, 0);
    scene.add(cart);
  } else {
    const lane = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, 0.04, 0.48),
      new THREE.MeshStandardMaterial({ color: "#314a5f", roughness: 0.75 }),
    );
    lane.position.set(-0.75, 0.04, 0);
    scene.add(lane);

    const counter = createPlatform("#5d4b37");
    counter.position.set(1.7, 0.08, 0);
    counter.scale.set(1.1, 1, 0.82);
    scene.add(counter);
  }
}

function createPlatform(color: string) {
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.16, 1.0),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
  );
  platform.receiveShadow = true;
  return platform;
}

function renderStackSnapshot(group: THREE.Group, snapshot: StructureSnapshot) {
  snapshot.items.forEach((item, index) => {
    const crate = createCrate(item);
    crate.position.set(-1.45, 0.25 + index * 0.42, 0);
    group.add(crate);
  });

  snapshot.processed.forEach((item, index) => {
    const crate = createCrate(item);
    crate.position.set(0.75 + index * 0.52, 0.25, 0);
    crate.rotation.y = -0.18;
    group.add(crate);
  });
}

function renderQueueSnapshot(group: THREE.Group, snapshot: StructureSnapshot) {
  snapshot.items.forEach((item, index) => {
    const learner = createLearner(item);
    learner.position.set(-1.75 + index * 0.72, 0.35, 0);
    group.add(learner);
  });

  snapshot.processed.forEach((item, index) => {
    const learner = createLearner(item);
    learner.position.set(1.25 + index * 0.48, 0.35, -0.18);
    learner.rotation.y = 0.32;
    group.add(learner);
  });
}

function renderMatrixSnapshot(
  group: THREE.Group,
  level: Extract<TraversalLevel, { kind: "matrix" }>,
  snapshot: TraversalSnapshot,
) {
  const rows = level.matrix.length;
  const cols = level.matrix[0]?.length ?? 0;
  const visited = new Set(snapshot.visited);

  level.matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const id = `${rowIndex},${colIndex}`;
      const isVisited = visited.has(id);
      const isCurrent = snapshot.current === id;
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, isCurrent ? 0.28 : 0.16, 0.68),
        new THREE.MeshStandardMaterial({
          color: isCurrent ? "#f4c95d" : isVisited ? "#68e1fd" : "#304052",
          roughness: 0.65,
          emissive: isCurrent ? "#473300" : "#000000",
          emissiveIntensity: isCurrent ? 0.18 : 0,
        }),
      );
      tile.position.set(
        (colIndex - (cols - 1) / 2) * 0.82,
        isCurrent ? 0.17 : 0.1,
        ((rows - 1) / 2 - rowIndex) * 0.82,
      );
      tile.castShadow = true;
      tile.receiveShadow = true;
      group.add(tile);

      const marker = createSmallMarker(String(value), isVisited ? "#0f1720" : "#8fa3b7");
      marker.position.set(tile.position.x, tile.position.y + 0.16, tile.position.z);
      group.add(marker);
    });
  });
}

function renderTreeSnapshot(
  group: THREE.Group,
  root: TreeNodeData,
  snapshot: TraversalSnapshot,
) {
  const positions = layoutTree(root);
  const visited = new Set(snapshot.visited);

  positions.forEach((position, id) => {
    const node = position.node;
    node.children?.forEach((child) => {
      const childPosition = positions.get(child.id);
      if (childPosition) {
        group.add(createTreeEdge(position.x, position.z, childPosition.x, childPosition.z));
      }
    });
  });

  positions.forEach((position, id) => {
    const isVisited = visited.has(id);
    const isCurrent = snapshot.current === id;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(isCurrent ? 0.28 : 0.22, 24, 16),
      new THREE.MeshStandardMaterial({
        color: isCurrent ? "#f4c95d" : isVisited ? "#80d37b" : "#3a4a5d",
        roughness: 0.58,
        emissive: isCurrent ? "#473300" : "#000000",
        emissiveIntensity: isCurrent ? 0.18 : 0,
      }),
    );
    node.position.set(position.x, 0.34, position.z);
    node.castShadow = true;
    group.add(node);

    const marker = createSmallMarker(position.node.value.slice(0, 2), "#101722");
    marker.position.set(position.x, 0.68, position.z);
    group.add(marker);
  });
}

function createTreeEdge(fromX: number, fromZ: number, toX: number, toZ: number) {
  const curve = new THREE.LineCurve3(
    new THREE.Vector3(fromX, 0.24, fromZ),
    new THREE.Vector3(toX, 0.24, toZ),
  );
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, 1, 0.025, 8),
    new THREE.MeshStandardMaterial({ color: "#6b7f94", roughness: 0.7 }),
  );
}

function createSmallMarker(_label: string, color: string) {
  const marker = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.06, 0.26),
    new THREE.MeshStandardMaterial({ color, roughness: 0.5 }),
  );
  marker.castShadow = true;
  return marker;
}

function createCrate(item: string) {
  const color = itemColors[item] ?? "#d6a866";
  const group = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.34, 0.5),
    new THREE.MeshStandardMaterial({ color, roughness: 0.62 }),
  );
  box.castShadow = true;
  group.add(box);

  const band = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.06, 0.54),
    new THREE.MeshStandardMaterial({ color: "#19202a", roughness: 0.7 }),
  );
  band.position.y = 0.02;
  group.add(band);
  return group;
}

function createLearner(item: string) {
  const color = itemColors[item] ?? "#68e1fd";
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.18, 0.34, 8, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.52 }),
  );
  body.castShadow = true;
  group.add(body);

  const snack = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.12, 0.12),
    new THREE.MeshStandardMaterial({ color: "#f4c95d", roughness: 0.55 }),
  );
  snack.position.set(0.2, 0.1, 0);
  snack.castShadow = true;
  group.add(snack);

  return group;
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

function toPath(level: GridLevel, trace: TraceEntry[]) {
  return [
    worldPosition(level, level.start.x, level.start.y).setY(0.46),
    ...trace
      .filter((entry) => typeof entry.state.x === "number" && typeof entry.state.y === "number")
      .map((entry) =>
        worldPosition(level, entry.state.x as number, entry.state.y as number).setY(0.46),
      ),
  ];
}

function toStructureSnapshots(level: StructureLevel, trace: TraceEntry[]) {
  return [
    {
      items: [...level.initialItems],
      processed: [],
    },
    ...trace.map((entry) => ({
      items: [...(entry.state.items ?? level.initialItems)],
      processed: [...(entry.state.processed ?? [])],
    })),
  ];
}

function toTraversalSnapshots(trace: TraceEntry[]) {
  return [
    {
      visited: [],
    },
    ...trace.map((entry) => ({
      current: entry.state.current,
      visited: [...(entry.state.visited ?? [])],
    })),
  ];
}

function layoutTree(root: TreeNodeData) {
  const positions = new Map<string, { node: TreeNodeData; x: number; z: number }>();
  const leaves: TreeNodeData[] = [];

  const collectLeaves = (node: TreeNodeData) => {
    if (!node.children || node.children.length === 0) {
      leaves.push(node);
      return;
    }

    node.children.forEach(collectLeaves);
  };

  collectLeaves(root);

  const leafX = new Map<string, number>();
  leaves.forEach((leaf, index) => {
    leafX.set(leaf.id, (index - (leaves.length - 1) / 2) * 1.0);
  });

  const place = (node: TreeNodeData, depth: number): number => {
    const children = node.children ?? [];
    const x =
      children.length === 0
        ? leafX.get(node.id) ?? 0
        : children.reduce((sum, child) => sum + place(child, depth + 1), 0) /
          children.length;
    positions.set(node.id, {
      node,
      x,
      z: (depth - 1) * 0.95,
    });
    return x;
  };

  place(root, 0);
  return positions;
}

function worldPosition(level: GridLevel, x: number, y: number) {
  return new THREE.Vector3(
    (x - (level.width - 1) / 2) * tileSize,
    0,
    ((level.height - 1) / 2 - y) * tileSize,
  );
}

function clearGroup(group: THREE.Group) {
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    disposeObject(child);
  }
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      disposeMaterial(child.material);
    }
  });
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }

  material.dispose();
}

function easeInOut(value: number) {
  return value < 0.5 ? 2 * value * value : 1 - (-2 * value + 2) ** 2 / 2;
}

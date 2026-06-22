# Animation System

The world animation is deterministic and trace-driven. User code does not directly animate anything. Instead, the sandboxed worker runs the player's compiled JavaScript, records each game API call as a `TraceEntry`, and the React UI replays that trace in Three.js.

## Data Flow

1. The learner edits TypeScript in Monaco.
2. `App.tsx` asks Monaco's TypeScript worker for diagnostics and JavaScript emit.
3. The emitted JavaScript and active `Level` are posted to `runner.worker.ts`.
4. The worker exposes level APIs such as `moveRight()`, `moveUp()`, and `log()`.
5. Each movement API mutates the worker's grid state and appends a `TraceEntry`.
6. The worker returns a `RunResult` containing `status`, `message`, and `trace`.
7. `WorldView.tsx` converts the trace into a path and animates the farmer along it.

## Key Types

The important shared types live in `src/types.ts`.

```ts
export type TraceEntry = {
  step: number;
  action: string;
  state: {
    x: number;
    y: number;
  };
  note: string;
};
```

`state.x` and `state.y` are grid coordinates after an action has completed. They are intentionally simple so the animation layer can stay separate from game-rule execution.

## Worker Responsibilities

`src/runner.worker.ts` is the source of truth for simulation state.

It handles:

- Starting from `level.start`.
- Bounds checking for movement.
- Recording trace entries after successful actions.
- Returning pass/fail/error status.

It does not know about Three.js, React, pixels, easing, or camera placement.

## WorldView Responsibilities

`src/WorldView.tsx` owns all Three.js rendering.

It handles:

- Creating a `THREE.Scene`, `PerspectiveCamera`, and `WebGLRenderer`.
- Creating field tiles from `level.width` and `level.height`.
- Creating the farmer mesh and goal marker mesh.
- Converting grid coordinates into world coordinates.
- Running the animation loop with `requestAnimationFrame`.
- Disposing Three.js resources when React remounts or unmounts the view.

## Coordinate Mapping

Game coordinates use a simple grid:

- `x` increases to the right.
- `y` increases upward in game terms.
- `(0, 0)` is the lower-left logical tile.

Three.js coordinates are centered so the board stays visually balanced:

```ts
function worldPosition(level: Level, x: number, y: number) {
  return new THREE.Vector3(
    (x - (level.width - 1) / 2) * tileSize,
    0,
    ((level.height - 1) / 2 - y) * tileSize,
  );
}
```

The logical `y` axis is mapped onto Three.js `z`, because Three.js `y` is used for height.

## Path Construction

`toPath()` builds an ordered list of world positions:

1. The level start position.
2. One position for each trace state.

```ts
function toPath(level: Level, trace: TraceEntry[]) {
  return [
    worldPosition(level, level.start.x, level.start.y).setY(0.46),
    ...trace.map((entry) =>
      worldPosition(level, entry.state.x, entry.state.y).setY(0.46),
    ),
  ];
}
```

The farmer's mesh height is set with Three.js `y = 0.46` so it sits above the field tiles.

## Animation Loop

The current system uses one animation segment per trace step.

- `stepDurationMs = 420`
- The active segment is computed from elapsed time.
- Playback time is clamped to the total path duration so the final movement does not loop.
- The segment progress is eased with `easeInOut()`.
- `farmer.position.lerpVectors(from, to, eased)` interpolates between tiles.
- Once playback has reached the end, the farmer is copied to the final path position.

Additional ambient motion is layered on top:

- The farmer gently bobs with `Math.sin(time / 140)`.
- The farmer subtly rotates with `Math.sin(time / 500)`.
- The goal marker spins a little every frame.

## Rendering and Resize

The renderer is resized inside the animation loop from the host element's current dimensions:

```ts
renderer.setSize(width, height, false);
camera.aspect = width / Math.max(height, 1);
camera.updateProjectionMatrix();
```

This keeps the canvas responsive as the app layout changes.

## Lifecycle

`WorldView` creates a fresh scene whenever `level` or `runResult.trace` changes.

The effect cleanup:

- Cancels the animation frame.
- Disposes the renderer.
- Disposes shared geometries/materials created in the effect.
- Removes the renderer canvas from the DOM.

This keeps level switches and reruns simple for the prototype.

## Extending Animations

For new level actions, keep the same split:

1. Add or update the game API in `runner.worker.ts`.
2. Record enough state in `TraceEntry` to describe the result.
3. Interpret that trace state in `WorldView.tsx`.

Examples:

- `plant()` could add `{ planted: [{ x, y }] }` to the returned world state.
- `harvest()` could add an action-specific event to the trace.
- Obstacles could live on `Level` and be rendered as static meshes.

For richer animation, prefer adding explicit trace metadata rather than making `WorldView` infer behavior from action strings.

## Current Limitations

- The animation replays from the beginning whenever the trace changes.
- The scene is recreated on each level switch or run result update.
- Trace entries currently store only position, action, and note.
- There is no pause, scrubber, or per-step playback control yet.

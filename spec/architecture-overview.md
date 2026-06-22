# Architecture Overview

This app is a fully client-side TypeScript learning minigame. There is no backend and no server-side compilation. The browser owns editing, type-checking, transpilation, user-code execution, game feedback, and world rendering.

## High-Level System

```mermaid
flowchart LR
  Learner[Learner] --> Editor[Monaco Editor]

  subgraph Browser[Browser-only React App]
    Editor --> TSService[Monaco TypeScript Worker]
    TSService --> Diagnostics[Diagnostics Panel]
    TSService --> Emit[JavaScript Emit]

    Emit --> Runner[Sandbox Web Worker]
    Levels[Level Data] --> Runner
    Runner --> Result[RunResult]

    Result --> Feedback[Feedback Panel]
    Result --> Trace[Execution Trace Panel]
    Result --> World[Three.js World View]
    Levels --> Sidebar[Level Sidebar]
    Levels --> World
  end
```

## Runtime Flow

```mermaid
sequenceDiagram
  participant User as Learner
  participant App as React App
  participant Monaco as Monaco TS Worker
  participant Worker as User Code Worker
  participant World as Three.js WorldView

  User->>App: Edit TypeScript
  User->>App: Click Run
  App->>Monaco: Request syntactic and semantic diagnostics
  Monaco-->>App: Diagnostics

  alt TypeScript has errors
    App->>App: Show diagnostics and stop
  else TypeScript is valid
    App->>Monaco: Request JavaScript emit
    Monaco-->>App: Emitted JavaScript
    App->>Worker: Post code and active level
    Worker->>Worker: Run solve() with movement APIs
    Worker-->>App: RunResult with trace
    App->>World: Pass level and trace
    World->>World: Replay trace as tile animation
  end
```

## Main Modules

```mermaid
flowchart TB
  AppTsx[src/App.tsx] --> LevelTs[src/level.ts]
  AppTsx --> Types[src/types.ts]
  AppTsx --> WorldView[src/WorldView.tsx]
  AppTsx --> RunnerWorker[src/runner.worker.ts]
  MainTsx[src/main.tsx] --> MonacoSetup[src/monacoSetup.ts]
  MainTsx --> AppTsx

  LevelTs --> Types
  RunnerWorker --> Types
  WorldView --> Types
```

## Responsibilities

`src/App.tsx` coordinates the UI. It owns the selected level, editor value, diagnostics, run status, and worker invocation.

`src/level.ts` defines level data and the TypeScript declarations that Monaco uses to understand the game API.

`src/runner.worker.ts` runs emitted JavaScript in a Web Worker and returns deterministic game results.

`src/WorldView.tsx` renders the tiny field with Three.js and animates the trace.

`src/monacoSetup.ts` configures Monaco's editor and TypeScript workers for Vite.

`src/types.ts` keeps shared contracts small and explicit.


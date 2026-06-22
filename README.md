# TypeScript Minigame Lab

TypeScript Minigame Lab is a browser-only coding game prototype for learning programming through playful UI problems. The idea is similar in spirit to Scratch: learners solve tiny, visual challenges and immediately see what happened. The twist is that they write real TypeScript, get real type feedback, and run real code in a sandboxed browser worker.

The main objective is to make programming feel tangible and fun without hiding the actual code. A learner writes `solve()`, runs it, watches a tiny Three.js world respond, and uses diagnostics plus an execution trace to understand the result.

## Features

- Monaco Editor for writing TypeScript.
- Monaco's built-in TypeScript worker for browser-side diagnostics and JavaScript emit.
- React Aria Components for accessible buttons and level navigation.
- Sandboxed Web Worker execution for user code.
- Level navigation sidebar.
- English and Spanish UI.
- Three.js world view that replays movement traces.
- No backend and no server-side compilation.

## Tech Stack

- pnpm
- Vite
- React
- TypeScript
- React Aria Components
- Monaco Editor
- Three.js
- Web Workers

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the dev server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## How It Works

The app stays entirely in the browser:

1. The learner writes TypeScript in Monaco.
2. Monaco type-checks and transpiles the code client-side.
3. The emitted JavaScript is sent to a sandboxed Web Worker.
4. The worker runs `solve()` against level APIs like `moveRight()` and `moveUp()`.
5. The worker returns pass/fail feedback plus an execution trace.
6. The Three.js world view animates the trace.

See the specs for more detail:

- [Architecture Overview](./spec/architecture-overview.md)
- [Animation System](./spec/animation-system.md)

## GitHub Pages Deployment

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

To deploy:

1. Push to the `main` branch.
2. In GitHub, open the repository settings.
3. Go to **Pages**.
4. Set **Build and deployment** source to **GitHub Actions**.

The workflow installs dependencies with pnpm, builds the Vite app, uploads `dist`, and deploys it to GitHub Pages.

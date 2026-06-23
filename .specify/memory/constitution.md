<!--
Sync Impact Report
Version change: 1.0.0 -> 1.1.0
Modified principles:
- III. Test-Backed Changes -> III. Test-Driven Changes
Added sections:
- None
Removed sections:
- None
Templates requiring updates:
- UPDATED .specify/templates/plan-template.md
- UPDATED .specify/templates/spec-template.md
- UPDATED .specify/templates/tasks-template.md
- UPDATED .specify/templates/commands/ (directory absent; no command templates to update)
- UPDATED .specify/extensions/agent-context/commands/speckit.agent-context.update.md
- UPDATED .opencode/commands/speckit.agent-context.update.md
- UPDATED README.md
Follow-up TODOs:
- None
-->
# TypeScript Minigame Lab Constitution

## Core Principles

### I. Browser-Only Learning Runtime
The application MUST remain a fully client-side Vite, React, and TypeScript
experience unless a future amendment explicitly approves a backend. Editing,
diagnostics, transpilation, learner-code execution, level feedback, persisted
drafts, and rendering MUST run in the browser. User code MUST execute only in a
dedicated Web Worker and MUST remain bounded by explicit timeout and step limits.
Features MUST NOT add server-side compilation, remote execution, telemetry, or
network dependencies to core level play without a documented privacy, safety, and
offline-use rationale.

Rationale: the product teaches through immediate, local feedback. Browser-only
execution keeps the prototype deployable to static hosting, protects learner
privacy, and makes the sandbox boundary visible in the architecture.

### II. Typed Contracts and Deterministic Simulation
Level behavior MUST be expressed through explicit TypeScript contracts in
`src/types.ts`, `src/level.ts`, and `src/runner.worker.ts`. The worker remains
the source of truth for game rules and MUST return deterministic `RunResult`
objects and trace entries for every learner-visible state change. Rendering
layers MUST consume trace data; they MUST NOT infer game success, mutate
simulation state, or depend on timing to decide correctness. New level kinds,
APIs, trace fields, and localized starter code MUST be added as typed,
exhaustive cases with no unhandled discriminated-union branch.

Rationale: clear contracts keep Monaco declarations, worker execution, output
panels, and Three.js replay aligned as the curriculum grows from grid movement
to stacks, queues, matrices, trees, and future concepts.

### III. Test-Driven Changes
Every behavior change MUST follow test-driven development: define the expected
behavior, write the smallest meaningful automated test first, observe that it
fails for the intended reason, implement the change, then refactor with tests
passing. Pure formatting helpers and deterministic logic MUST use Vitest unit
tests. Learner journeys, localization, Monaco integration, worker execution,
level completion, panel output, and regression-prone UI flows MUST use Cypress
end-to-end coverage. Changes to runner rules or level data MUST cover success,
failure, bounds/error behavior, and trace output for each affected level kind. A
change is not mergeable until `pnpm lint`, `pnpm test:unit`, `pnpm test:e2e`,
and `pnpm build` pass or any skipped command is explicitly documented with a
project-owner-approved reason.

Rationale: learners rely on trustworthy feedback. TDD protects both the
code-learning contract and the browser integrations that are expensive to check
manually, while keeping each change tied to an observable learner outcome.

### IV. Consistent Learner Experience
Learner-facing UI MUST be keyboard-operable, accessible through React Aria or
equivalent accessible primitives, and understandable without relying on the
Three.js canvas alone. Every visual world outcome MUST have equivalent textual
status, diagnostics, trace, or goal summary output. English and Spanish copy
MUST stay complete for navigation, starter code, API references, hints,
diagnostics framing, and runner feedback. UI additions MUST preserve the
existing compact lab layout, panel collapse behavior, focus indicators, dark
theme tokens, and responsive single-column mobile flow unless a spec documents a
better learner outcome.

Rationale: the app is a teaching environment. Consistent copy, accessible
controls, and redundant feedback make debugging possible for more learners and
make visual animation a reinforcement instead of the only source of truth.

### V. Performance and Resource Stewardship
Interactive feedback MUST stay fast enough for iterative learning. Type checking
and run feedback SHOULD complete within one second for bundled levels on a
typical development laptop, and worker execution MUST keep the existing bounded
runtime model unless amended. Three.js scenes MUST dispose renderers,
geometries, materials, animation frames, and dynamic groups during reruns,
level switches, and unmounts. New dependencies, assets, or Monaco/Three.js
features MUST justify bundle and runtime cost in the implementation plan. Any
change that increases level complexity, animation work, or worker API surface
MUST include an explicit performance risk assessment and verification approach.

Rationale: slow or leaky feedback breaks the learning loop, and this app ships
as a static browser bundle where every dependency and render path matters.

## Product and Technical Constraints

- The supported stack is pnpm, Vite, React, TypeScript strict mode, React Aria
  Components, Monaco Editor, Three.js, Web Workers, Vitest, Cypress, and ESLint.
- The repository structure MUST keep shared runtime contracts in `src/types.ts`,
  level definitions and localized starter code in `src/level.ts`, simulation in
  `src/runner.worker.ts`, rendering in `src/WorldView.tsx`, and app
  orchestration in React views unless a plan documents a better boundary.
- Level data MUST include stable ids, localized names/objectives/hints/concepts,
  starter code generated from the active locale, and deterministic goal
  criteria.
- Runtime copy MUST be ASCII-compatible unless a feature intentionally introduces
  accented or non-Latin localized text and updates tests accordingly.
- Static deployment to GitHub Pages MUST remain supported; Vite base-path and
  build outputs MUST continue to work from a non-root static path.

## Delivery Workflow and Quality Gates

- Specs MUST describe user journeys, independent tests, TDD expectations,
  accessibility and localization expectations, performance targets, and edge
  cases before planning.
- Plans MUST pass the Constitution Check before implementation research and
  again after design. Any violation MUST be listed in Complexity Tracking with a
  simpler alternative and a concrete mitigation.
- Tasks MUST be organized by independently testable user story and MUST put
  failing test tasks before implementation tasks for behavior changes. They MUST
  include implementation, localization/accessibility, performance, and
  documentation work where applicable.
- Review MUST verify worker isolation, typed contracts, deterministic trace
  output, complete localized copy, accessible controls, resource cleanup, and the
  required command results.
- Documentation updates MUST accompany changes that alter architecture, level
  authoring, animation behavior, deployment, or developer commands.

## Governance

This constitution supersedes conflicting local habits, generated templates, and
ad hoc implementation preferences. Amendments require a written change to this
file, an updated Sync Impact Report, a semantic version bump, and synchronized
updates to affected Spec Kit templates and runtime guidance.

Versioning policy:
- MAJOR for removing or redefining a principle, relaxing a non-negotiable gate,
  or approving a backward-incompatible architecture change such as required
  backend execution.
- MINOR for adding a principle, adding a governance section, or materially
  expanding required checks.
- PATCH for clarifications, wording fixes, and non-semantic refinements.

Compliance review is required for every feature plan, task list, and code review.
If a delivery cannot satisfy a MUST-level rule, the plan MUST document the
violation, mitigation, owner approval, and follow-up before implementation
continues. SHOULD-level guidance may be bypassed only when the plan explains the
tradeoff and preserves the learner experience.

**Version**: 1.1.0 | **Ratified**: 2026-06-23 | **Last Amended**: 2026-06-23

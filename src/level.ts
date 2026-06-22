import type { Level } from "./types";

export const gameApiTypes = `declare function moveRight(): void;
declare function moveLeft(): void;
declare function moveUp(): void;
declare function moveDown(): void;
declare function log(message: string): void;
`;

export const levels: Level[] = [
  {
    id: "furrow-east",
    name: "Level 1: Furrow East",
    objective: "Move the farmer two tiles to the crop marker.",
    hint: "Call moveRight() twice.",
    starterCode: `function solve() {
  moveRight();
  moveRight();
}
`,
    width: 4,
    height: 3,
    start: { x: 0, y: 1 },
    goal: { x: 2, y: 1 },
  },
  {
    id: "north-plot",
    name: "Level 2: North Plot",
    objective: "Move up two tiles, then right once to reach the marker.",
    hint: "Try moveUp(), moveUp(), then moveRight().",
    starterCode: `function solve() {
  moveUp();
  moveUp();
  moveRight();
}
`,
    width: 4,
    height: 4,
    start: { x: 1, y: 0 },
    goal: { x: 2, y: 2 },
  },
];

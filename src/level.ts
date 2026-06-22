import type {
  GridLevel,
  Level,
  Locale,
  StructureLevel,
  TraversalLevel,
} from "./types";

export const gameApiTypes = `declare function moveRight(): void;
declare function moveLeft(): void;
declare function moveUp(): void;
declare function moveDown(): void;
declare function log(message: string): void;

interface GameStack<T = string> {
  push(item: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  size(): number;
}

interface GameQueue<T = string> {
  enqueue(item: T): void;
  dequeue(): T | undefined;
  peek(): T | undefined;
  size(): number;
}

interface GameMatrix<T = string> {
  rows: number;
  cols: number;
  get(row: number, col: number): T;
  visit(row: number, col: number): void;
}

interface GameTreeNode<T = string> {
  id: string;
  value: T;
  children: GameTreeNode<T>[];
}

interface GameTree<T = string> {
  root: GameTreeNode<T>;
  visit(node: GameTreeNode<T>): void;
}
`;

type LocalizedLevelCopy = Pick<Level, "name" | "objective" | "hint">;
type WithoutLocalizedCopy<T> = T extends unknown
  ? Omit<T, keyof LocalizedLevelCopy>
  : never;
type LevelBlueprint = (
  | WithoutLocalizedCopy<GridLevel>
  | WithoutLocalizedCopy<StructureLevel>
  | WithoutLocalizedCopy<TraversalLevel>
) & {
  copy: Record<Locale, LocalizedLevelCopy>;
};

const levelBlueprints: LevelBlueprint[] = [
  {
    id: "furrow-east",
    kind: "grid",
    starterCode: `function solve() {
  moveRight();
  moveRight();
}
`,
    width: 4,
    height: 3,
    start: { x: 0, y: 1 },
    goal: { x: 2, y: 1 },
    copy: {
      en: {
        name: "Level 1: Furrow East",
        objective: "Move the farmer two tiles to the crop marker.",
        hint: "Call moveRight() twice.",
      },
      es: {
        name: "Nivel 1: Surco este",
        objective: "Mueve al granjero dos casillas hasta el marcador de cultivo.",
        hint: "Llama moveRight() dos veces.",
      },
    },
  },
  {
    id: "north-plot",
    kind: "grid",
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
    copy: {
      en: {
        name: "Level 2: North Plot",
        objective: "Move up two tiles, then right once to reach the marker.",
        hint: "Try moveUp(), moveUp(), then moveRight().",
      },
      es: {
        name: "Nivel 2: Parcela norte",
        objective: "Sube dos casillas y luego avanza una a la derecha hasta el marcador.",
        hint: "Prueba moveUp(), moveUp() y luego moveRight().",
      },
    },
  },
  {
    id: "supply-stack",
    kind: "stack",
    starterCode: `function solve(stack: GameStack<string>) {
  stack.pop();
  stack.pop();
  stack.pop();
}
`,
    initialItems: ["soil", "seed", "water"],
    goalItems: [],
    goalProcessed: ["water", "seed", "soil"],
    copy: {
      en: {
        name: "Level 3: Supply Stack",
        objective: "Unload the supply stack from the top crate down.",
        hint: "A stack is LIFO: the last crate added is the first one removed.",
      },
      es: {
        name: "Nivel 3: Pila de suministros",
        objective: "Descarga la pila de suministros desde la caja superior.",
        hint: "Una pila es LIFO: lo ultimo que entra es lo primero que sale.",
      },
    },
  },
  {
    id: "snack-queue",
    kind: "queue",
    starterCode: `function solve(queue: GameQueue<string>) {
  queue.dequeue();
  queue.dequeue();
  queue.dequeue();
}
`,
    initialItems: ["ada", "bea", "cosmo"],
    goalItems: [],
    goalProcessed: ["ada", "bea", "cosmo"],
    copy: {
      en: {
        name: "Level 4: Snack Queue",
        objective: "Serve the snack line in arrival order.",
        hint: "A queue is FIFO: the first learner in line is served first.",
      },
      es: {
        name: "Nivel 4: Cola de merienda",
        objective: "Atiende la cola de merienda en orden de llegada.",
        hint: "Una cola es FIFO: la primera persona en llegar sale primero.",
      },
    },
  },
  {
    id: "market-matrix-path",
    kind: "matrix",
    starterCode: `function solve(matrix: GameMatrix<string>) {
  matrix.visit(0, 0);
  matrix.visit(0, 1);
  matrix.visit(0, 2);
  matrix.visit(1, 2);
  matrix.visit(2, 2);
}
`,
    matrix: [
      ["A", "B", "C"],
      ["D", "E", "F"],
      ["G", "H", "I"],
    ],
    expectedVisited: ["0,0", "0,1", "0,2", "1,2", "2,2"],
    copy: {
      en: {
        name: "Level 5: Market Matrix",
        objective: "Visit the market stalls in the exact highlighted path.",
        hint: "Use matrix.visit(row, col) for each coordinate in order.",
      },
      es: {
        name: "Nivel 5: Matriz de mercado",
        objective: "Visita los puestos del mercado en la ruta marcada exacta.",
        hint: "Usa matrix.visit(fila, columna) para cada coordenada en orden.",
      },
    },
  },
  {
    id: "quest-tree-direct",
    kind: "tree",
    starterCode: `function solve(tree: GameTree<string>) {
  const root = tree.root;
  tree.visit(root);
  tree.visit(root.children[0]);
  tree.visit(root.children[1]);
}
`,
    tree: {
      id: "camp",
      value: "Camp",
      children: [
        { id: "forge", value: "Forge", children: [] },
        { id: "garden", value: "Garden", children: [] },
      ],
    },
    expectedVisited: ["camp", "forge", "garden"],
    copy: {
      en: {
        name: "Level 6: Quest Tree",
        objective: "Visit the camp, then its two nearby quest spots.",
        hint: "Read children from tree.root and pass each node to tree.visit(node).",
      },
      es: {
        name: "Nivel 6: Arbol de misiones",
        objective: "Visita el campamento y luego sus dos puntos de mision cercanos.",
        hint: "Lee children desde tree.root y pasa cada nodo a tree.visit(node).",
      },
    },
  },
  {
    id: "warehouse-matrix-scan",
    kind: "matrix",
    starterCode: `function solve(matrix: GameMatrix<string>) {
  for (let row = 0; row < matrix.rows; row += 1) {
    for (let col = 0; col < matrix.cols; col += 1) {
      matrix.visit(row, col);
    }
  }
}
`,
    matrix: [
      ["A1", "A2", "A3"],
      ["B1", "B2", "B3"],
      ["C1", "C2", "C3"],
    ],
    expectedVisited: [
      "0,0",
      "0,1",
      "0,2",
      "1,0",
      "1,1",
      "1,2",
      "2,0",
      "2,1",
      "2,2",
    ],
    copy: {
      en: {
        name: "Level 7: Warehouse Scan",
        objective: "Scan every shelf in the matrix from left to right, top to bottom.",
        hint: "Nested loops work well when you know rows and columns.",
      },
      es: {
        name: "Nivel 7: Escaneo de almacen",
        objective: "Escanea cada estante de la matriz de izquierda a derecha y de arriba abajo.",
        hint: "Los bucles anidados sirven cuando conoces filas y columnas.",
      },
    },
  },
  {
    id: "skill-tree-depth-first",
    kind: "tree",
    starterCode: `function solve(tree: GameTree<string>) {
  function walk(node: GameTreeNode<string>) {
    tree.visit(node);

    for (const child of node.children) {
      walk(child);
    }
  }

  walk(tree.root);
}
`,
    tree: {
      id: "basics",
      value: "Basics",
      children: [
        {
          id: "loops",
          value: "Loops",
          children: [
            { id: "for", value: "For", children: [] },
            { id: "while", value: "While", children: [] },
          ],
        },
        {
          id: "functions",
          value: "Functions",
          children: [{ id: "recursion", value: "Recursion", children: [] }],
        },
      ],
    },
    expectedVisited: [
      "basics",
      "loops",
      "for",
      "while",
      "functions",
      "recursion",
    ],
    copy: {
      en: {
        name: "Level 8: Skill Tree",
        objective: "Traverse the whole skill tree with depth-first recursion.",
        hint: "Visit the current node, then recursively walk each child.",
      },
      es: {
        name: "Nivel 8: Arbol de habilidades",
        objective: "Recorre todo el arbol de habilidades con recursion en profundidad.",
        hint: "Visita el nodo actual y luego recorre cada hijo de forma recursiva.",
      },
    },
  },
];

export function getLevels(locale: Locale): Level[] {
  return levelBlueprints.map(({ copy, ...level }) => ({
    ...level,
    ...copy[locale],
  }));
}

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

type LocalizedLevelCopy = {
  name: string;
  objective: string;
  hint: string;
  conceptTitle: string;
  concept: string[];
};
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
  // Your code here.
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
        conceptTitle: "Sequencing",
        concept: [
          "Programs run one statement after another.",
          "Each movement call changes the world by one tile.",
          "Repeat the same call when you need the same action twice.",
        ],
      },
      es: {
        name: "Nivel 1: Surco este",
        objective: "Mueve al granjero dos casillas hasta el marcador de cultivo.",
        hint: "Llama moveRight() dos veces.",
        conceptTitle: "Secuencia",
        concept: [
          "Los programas ejecutan una instruccion despues de otra.",
          "Cada llamada de movimiento cambia el mundo una casilla.",
          "Repite la misma llamada cuando necesitas la misma accion dos veces.",
        ],
      },
    },
  },
  {
    id: "north-plot",
    kind: "grid",
    starterCode: `function solve() {
  // Your code here.
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
        conceptTitle: "Coordinates",
        concept: [
          "Grid worlds use horizontal and vertical positions.",
          "Changing direction means choosing a different movement function.",
          "Order matters because each step starts from the current tile.",
        ],
      },
      es: {
        name: "Nivel 2: Parcela norte",
        objective: "Sube dos casillas y luego avanza una a la derecha hasta el marcador.",
        hint: "Prueba moveUp(), moveUp() y luego moveRight().",
        conceptTitle: "Coordenadas",
        concept: [
          "Los mundos de grilla usan posiciones horizontales y verticales.",
          "Cambiar de direccion significa elegir otra funcion de movimiento.",
          "El orden importa porque cada paso empieza desde la casilla actual.",
        ],
      },
    },
  },
  {
    id: "supply-stack",
    kind: "stack",
    starterCode: `function solve(stack: GameStack<string>) {
  // Your code here.
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
        conceptTitle: "Stacks",
        concept: [
          "A stack behaves like crates piled on top of each other.",
          "pop() removes the top item.",
          "This is called LIFO: last in, first out.",
        ],
      },
      es: {
        name: "Nivel 3: Pila de suministros",
        objective: "Descarga la pila de suministros desde la caja superior.",
        hint: "Una pila es LIFO: lo ultimo que entra es lo primero que sale.",
        conceptTitle: "Pilas",
        concept: [
          "Una pila funciona como cajas apiladas una sobre otra.",
          "pop() quita el elemento de arriba.",
          "Esto se llama LIFO: ultimo en entrar, primero en salir.",
        ],
      },
    },
  },
  {
    id: "snack-queue",
    kind: "queue",
    starterCode: `function solve(queue: GameQueue<string>) {
  // Your code here.
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
        conceptTitle: "Queues",
        concept: [
          "A queue behaves like a line of people waiting.",
          "dequeue() removes the front item.",
          "This is called FIFO: first in, first out.",
        ],
      },
      es: {
        name: "Nivel 4: Cola de merienda",
        objective: "Atiende la cola de merienda en orden de llegada.",
        hint: "Una cola es FIFO: la primera persona en llegar sale primero.",
        conceptTitle: "Colas",
        concept: [
          "Una cola funciona como una fila de personas esperando.",
          "dequeue() quita el elemento del frente.",
          "Esto se llama FIFO: primero en entrar, primero en salir.",
        ],
      },
    },
  },
  {
    id: "market-matrix-path",
    kind: "matrix",
    starterCode: `function solve(matrix: GameMatrix<string>) {
  // Your code here.
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
        conceptTitle: "Matrix Access",
        concept: [
          "A matrix is a grid addressed by row and column.",
          "Rows usually come first, then columns.",
          "Direct visits are useful when the path is already known.",
        ],
      },
      es: {
        name: "Nivel 5: Matriz de mercado",
        objective: "Visita los puestos del mercado en la ruta marcada exacta.",
        hint: "Usa matrix.visit(fila, columna) para cada coordenada en orden.",
        conceptTitle: "Acceso a matrices",
        concept: [
          "Una matriz es una grilla identificada por fila y columna.",
          "Normalmente se escribe primero la fila y luego la columna.",
          "Las visitas directas sirven cuando la ruta ya se conoce.",
        ],
      },
    },
  },
  {
    id: "quest-tree-direct",
    kind: "tree",
    starterCode: `function solve(tree: GameTree<string>) {
  // Your code here.
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
        conceptTitle: "Tree Nodes",
        concept: [
          "A tree starts at one root node.",
          "Each node can have child nodes below it.",
          "Following children lets you move through branching data.",
        ],
      },
      es: {
        name: "Nivel 6: Arbol de misiones",
        objective: "Visita el campamento y luego sus dos puntos de mision cercanos.",
        hint: "Lee children desde tree.root y pasa cada nodo a tree.visit(node).",
        conceptTitle: "Nodos de arbol",
        concept: [
          "Un arbol empieza en un nodo raiz.",
          "Cada nodo puede tener nodos hijos debajo.",
          "Seguir children te permite recorrer datos con ramas.",
        ],
      },
    },
  },
  {
    id: "warehouse-matrix-scan",
    kind: "matrix",
    starterCode: `function solve(matrix: GameMatrix<string>) {
  // Your code here.
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
        conceptTitle: "Nested Loops",
        concept: [
          "A full matrix traversal usually needs two loops.",
          "The outer loop chooses the row.",
          "The inner loop visits each column in that row.",
        ],
      },
      es: {
        name: "Nivel 7: Escaneo de almacen",
        objective: "Escanea cada estante de la matriz de izquierda a derecha y de arriba abajo.",
        hint: "Los bucles anidados sirven cuando conoces filas y columnas.",
        conceptTitle: "Bucles anidados",
        concept: [
          "Recorrer toda una matriz normalmente necesita dos bucles.",
          "El bucle externo elige la fila.",
          "El bucle interno visita cada columna de esa fila.",
        ],
      },
    },
  },
  {
    id: "skill-tree-depth-first",
    kind: "tree",
    starterCode: `function solve(tree: GameTree<string>) {
  // Your code here.
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
        conceptTitle: "Depth-First Search",
        concept: [
          "Depth-first traversal visits a node before going deeper into children.",
          "Recursion is a natural fit because each child is also a tree.",
          "A helper function can call itself for every child node.",
        ],
      },
      es: {
        name: "Nivel 8: Arbol de habilidades",
        objective: "Recorre todo el arbol de habilidades con recursion en profundidad.",
        hint: "Visita el nodo actual y luego recorre cada hijo de forma recursiva.",
        conceptTitle: "Busqueda en profundidad",
        concept: [
          "El recorrido en profundidad visita un nodo antes de bajar a sus hijos.",
          "La recursion encaja bien porque cada hijo tambien es un arbol.",
          "Una funcion auxiliar puede llamarse a si misma por cada nodo hijo.",
        ],
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

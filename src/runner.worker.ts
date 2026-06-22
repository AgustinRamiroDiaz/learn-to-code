import type { Level, Locale, RunResult, TraceEntry, TreeNodeData } from "./types";

type RunRequest = {
  code: string;
  level: Level;
  locale: Locale;
};

const maxSteps = 40;

self.onmessage = (event: MessageEvent<RunRequest>) => {
  const result = runUserCode(event.data.code, event.data.level, event.data.locale);
  self.postMessage(result);
};

const runnerCopy = {
  en: {
    tooManyActions: `Too many actions. Keep the solution under ${maxSteps} steps.`,
    moveRightBounds: "moveRight() would leave the field.",
    moveLeftBounds: "moveLeft() would leave the field.",
    moveUpBounds: "moveUp() would leave the field.",
    moveDownBounds: "moveDown() would leave the field.",
    defineSolve: "Define a solve() function.",
    passed: (levelName: string) => `${levelName} passed. The crop marker is reached.`,
    failed: (x: number, y: number, goalX: number, goalY: number) =>
      `Not quite. Ended at x=${x}, y=${y}; goal is x=${goalX}, y=${goalY}.`,
    unknownError: "Unknown runtime error.",
    movedX: (x: number) => `Moved to x=${x}.`,
    movedY: (y: number) => `Moved to y=${y}.`,
    stackPassed: (levelName: string) => `${levelName} passed. The stack was unloaded correctly.`,
    queuePassed: (levelName: string) => `${levelName} passed. The queue was served in order.`,
    structureFailed: (remaining: string[], processed: string[]) =>
      `Not quite. Remaining: ${formatItems(remaining)}. Processed: ${formatItems(processed)}.`,
    pushed: (item: string) => `Pushed ${item} onto the stack.`,
    popped: (item: string) => `Popped ${item} from the stack.`,
    emptyStack: "The stack is empty.",
    enqueued: (item: string) => `Added ${item} to the back of the queue.`,
    dequeued: (item: string) => `Served ${item} from the front of the queue.`,
    emptyQueue: "The queue is empty.",
    traversalPassed: (levelName: string) => `${levelName} passed. The traversal order is correct.`,
    traversalFailed: (actual: string[], expected: string[]) =>
      `Not quite. Visited ${formatItems(actual)}; expected ${formatItems(expected)}.`,
    matrixBounds: "That matrix coordinate is outside the world.",
    matrixVisited: (row: number, col: number, value: string) =>
      `Visited row ${row}, col ${col}: ${value}.`,
    treeVisited: (value: string) => `Visited ${value}.`,
    unknownTreeNode: "That tree node does not belong to this world.",
  },
  es: {
    tooManyActions: `Demasiadas acciones. Manten la solucion por debajo de ${maxSteps} pasos.`,
    moveRightBounds: "moveRight() saldria del campo.",
    moveLeftBounds: "moveLeft() saldria del campo.",
    moveUpBounds: "moveUp() saldria del campo.",
    moveDownBounds: "moveDown() saldria del campo.",
    defineSolve: "Define una funcion solve().",
    passed: (levelName: string) => `${levelName} completado. Llegaste al marcador de cultivo.`,
    failed: (x: number, y: number, goalX: number, goalY: number) =>
      `Casi. Terminaste en x=${x}, y=${y}; la meta es x=${goalX}, y=${goalY}.`,
    unknownError: "Error de ejecucion desconocido.",
    movedX: (x: number) => `Movido a x=${x}.`,
    movedY: (y: number) => `Movido a y=${y}.`,
    stackPassed: (levelName: string) => `${levelName} completado. La pila se descargo correctamente.`,
    queuePassed: (levelName: string) => `${levelName} completado. La cola se atendio en orden.`,
    structureFailed: (remaining: string[], processed: string[]) =>
      `Casi. Restantes: ${formatItems(remaining)}. Procesados: ${formatItems(processed)}.`,
    pushed: (item: string) => `Agregado ${item} a la pila.`,
    popped: (item: string) => `Retirado ${item} de la pila.`,
    emptyStack: "La pila esta vacia.",
    enqueued: (item: string) => `Agregado ${item} al final de la cola.`,
    dequeued: (item: string) => `Atendido ${item} desde el frente de la cola.`,
    emptyQueue: "La cola esta vacia.",
    traversalPassed: (levelName: string) => `${levelName} completado. El orden del recorrido es correcto.`,
    traversalFailed: (actual: string[], expected: string[]) =>
      `Casi. Visitaste ${formatItems(actual)}; se esperaba ${formatItems(expected)}.`,
    matrixBounds: "Esa coordenada de la matriz esta fuera del mundo.",
    matrixVisited: (row: number, col: number, value: string) =>
      `Visitado fila ${row}, columna ${col}: ${value}.`,
    treeVisited: (value: string) => `Visitado ${value}.`,
    unknownTreeNode: "Ese nodo no pertenece a este mundo.",
  },
} satisfies Record<Locale, {
  tooManyActions: string;
  moveRightBounds: string;
  moveLeftBounds: string;
  moveUpBounds: string;
  moveDownBounds: string;
  defineSolve: string;
  passed: (levelName: string) => string;
  failed: (x: number, y: number, goalX: number, goalY: number) => string;
  unknownError: string;
  movedX: (x: number) => string;
  movedY: (y: number) => string;
  stackPassed: (levelName: string) => string;
  queuePassed: (levelName: string) => string;
  structureFailed: (remaining: string[], processed: string[]) => string;
  pushed: (item: string) => string;
  popped: (item: string) => string;
  emptyStack: string;
  enqueued: (item: string) => string;
  dequeued: (item: string) => string;
  emptyQueue: string;
  traversalPassed: (levelName: string) => string;
  traversalFailed: (actual: string[], expected: string[]) => string;
  matrixBounds: string;
  matrixVisited: (row: number, col: number, value: string) => string;
  treeVisited: (value: string) => string;
  unknownTreeNode: string;
}>;

function runUserCode(code: string, level: Level, locale: Locale): RunResult {
  if (level.kind === "matrix") {
    return runMatrixLevel(code, level, locale);
  }

  if (level.kind === "tree") {
    return runTreeLevel(code, level, locale);
  }

  if (level.kind === "stack") {
    return runStackLevel(code, level, locale);
  }

  if (level.kind === "queue") {
    return runQueueLevel(code, level, locale);
  }

  return runGridLevel(code, level, locale);
}

function runGridLevel(code: string, level: Extract<Level, { kind: "grid" }>, locale: Locale): RunResult {
  const t = runnerCopy[locale];
  const trace: TraceEntry[] = [];
  const state = {
    ...level.start,
  };

  const addTrace = (action: string, note: string) => {
    if (trace.length >= maxSteps) {
      throw new Error(t.tooManyActions);
    }

    trace.push({
      step: trace.length + 1,
      action,
      state: { ...state },
      note,
    });
  };

  const moveRight = () => {
    if (state.x + 1 >= level.width) {
      throw new Error(t.moveRightBounds);
    }

    state.x += 1;
    addTrace("moveRight()", t.movedX(state.x));
  };

  const moveLeft = () => {
    if (state.x - 1 < 0) {
      throw new Error(t.moveLeftBounds);
    }

    state.x -= 1;
    addTrace("moveLeft()", t.movedX(state.x));
  };

  const moveUp = () => {
    if (state.y + 1 >= level.height) {
      throw new Error(t.moveUpBounds);
    }

    state.y += 1;
    addTrace("moveUp()", t.movedY(state.y));
  };

  const moveDown = () => {
    if (state.y - 1 < 0) {
      throw new Error(t.moveDownBounds);
    }

    state.y -= 1;
    addTrace("moveDown()", t.movedY(state.y));
  };

  const log = (message: string) => {
    addTrace("log()", String(message));
  };

  try {
    const userProgram = new Function(
      "moveRight",
      "moveLeft",
      "moveUp",
      "moveDown",
      "log",
      `${code}

if (typeof solve !== "function") {
  throw new Error(${JSON.stringify(t.defineSolve)});
}

solve();`,
    );

    userProgram(moveRight, moveLeft, moveUp, moveDown, log);

    if (state.x === level.goal.x && state.y === level.goal.y) {
      return {
        status: "passed",
        message: t.passed(level.name),
        trace,
      };
    }

    return {
      status: "failed",
      message: t.failed(state.x, state.y, level.goal.x, level.goal.y),
      trace,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : t.unknownError,
      trace,
    };
  }
}

function runStackLevel(code: string, level: Extract<Level, { kind: "stack" }>, locale: Locale): RunResult {
  const t = runnerCopy[locale];
  const trace: TraceEntry[] = [];
  const items = [...level.initialItems];
  const processed: string[] = [];

  const addTrace = (action: string, note: string) => {
    if (trace.length >= maxSteps) {
      throw new Error(t.tooManyActions);
    }

    trace.push({
      step: trace.length + 1,
      action,
      state: {
        items: [...items],
        processed: [...processed],
      },
      note,
    });
  };

  const stack = {
    push(item: string) {
      items.push(String(item));
      addTrace(`stack.push(${JSON.stringify(String(item))})`, t.pushed(String(item)));
    },
    pop() {
      const item = items.pop();
      if (item === undefined) {
        addTrace("stack.pop()", t.emptyStack);
        return undefined;
      }

      processed.push(item);
      addTrace("stack.pop()", t.popped(item));
      return item;
    },
    peek() {
      return items.at(-1);
    },
    size() {
      return items.length;
    },
  };

  return runStructureProgram(code, level, locale, "stack", stack, trace, items, processed);
}

function runQueueLevel(code: string, level: Extract<Level, { kind: "queue" }>, locale: Locale): RunResult {
  const t = runnerCopy[locale];
  const trace: TraceEntry[] = [];
  const items = [...level.initialItems];
  const processed: string[] = [];

  const addTrace = (action: string, note: string) => {
    if (trace.length >= maxSteps) {
      throw new Error(t.tooManyActions);
    }

    trace.push({
      step: trace.length + 1,
      action,
      state: {
        items: [...items],
        processed: [...processed],
      },
      note,
    });
  };

  const queue = {
    enqueue(item: string) {
      items.push(String(item));
      addTrace(`queue.enqueue(${JSON.stringify(String(item))})`, t.enqueued(String(item)));
    },
    dequeue() {
      const item = items.shift();
      if (item === undefined) {
        addTrace("queue.dequeue()", t.emptyQueue);
        return undefined;
      }

      processed.push(item);
      addTrace("queue.dequeue()", t.dequeued(item));
      return item;
    },
    peek() {
      return items[0];
    },
    size() {
      return items.length;
    },
  };

  return runStructureProgram(code, level, locale, "queue", queue, trace, items, processed);
}

function runStructureProgram(
  code: string,
  level: Extract<Level, { kind: "stack" | "queue" }>,
  locale: Locale,
  argumentName: "stack" | "queue",
  argument: unknown,
  trace: TraceEntry[],
  items: string[],
  processed: string[],
): RunResult {
  const t = runnerCopy[locale];

  try {
    const userProgram = new Function(
      argumentName,
      "log",
      `${code}

if (typeof solve !== "function") {
  throw new Error(${JSON.stringify(t.defineSolve)});
}

solve(${argumentName});`,
    );

    const log = (message: string) => {
      if (trace.length >= maxSteps) {
        throw new Error(t.tooManyActions);
      }

      trace.push({
        step: trace.length + 1,
        action: "log()",
        state: {
          items: [...items],
          processed: [...processed],
        },
        note: String(message),
      });
    };

    userProgram(argument, log);

    if (sameItems(items, level.goalItems) && sameItems(processed, level.goalProcessed)) {
      return {
        status: "passed",
        message:
          level.kind === "stack"
            ? t.stackPassed(level.name)
            : t.queuePassed(level.name),
        trace,
      };
    }

    return {
      status: "failed",
      message: t.structureFailed(items, processed),
      trace,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : t.unknownError,
      trace,
    };
  }
}

function runMatrixLevel(code: string, level: Extract<Level, { kind: "matrix" }>, locale: Locale): RunResult {
  const t = runnerCopy[locale];
  const trace: TraceEntry[] = [];
  const visited: string[] = [];

  const addVisit = (row: number, col: number) => {
    if (trace.length >= maxSteps) {
      throw new Error(t.tooManyActions);
    }

    if (
      !Number.isInteger(row) ||
      !Number.isInteger(col) ||
      row < 0 ||
      col < 0 ||
      row >= level.matrix.length ||
      col >= (level.matrix[row]?.length ?? 0)
    ) {
      throw new Error(t.matrixBounds);
    }

    const id = `${row},${col}`;
    const value = String(level.matrix[row][col]);
    visited.push(id);
    trace.push({
      step: trace.length + 1,
      action: `matrix.visit(${row}, ${col})`,
      state: {
        current: id,
        visited: [...visited],
      },
      note: t.matrixVisited(row, col, value),
    });
  };

  const matrix = {
    rows: level.matrix.length,
    cols: level.matrix[0]?.length ?? 0,
    get(row: number, col: number) {
      if (
        !Number.isInteger(row) ||
        !Number.isInteger(col) ||
        row < 0 ||
        col < 0 ||
        row >= level.matrix.length ||
        col >= (level.matrix[row]?.length ?? 0)
      ) {
        throw new Error(t.matrixBounds);
      }

      return level.matrix[row][col];
    },
    visit: addVisit,
  };

  return runTraversalProgram(code, level, locale, "matrix", matrix, trace, visited);
}

function runTreeLevel(code: string, level: Extract<Level, { kind: "tree" }>, locale: Locale): RunResult {
  const t = runnerCopy[locale];
  const trace: TraceEntry[] = [];
  const visited: string[] = [];
  const nodesById = new Map<string, TreeNodeData>();
  collectTreeNodes(level.tree, nodesById);

  const addVisit = (node: TreeNodeData) => {
    if (trace.length >= maxSteps) {
      throw new Error(t.tooManyActions);
    }

    const knownNode = node && nodesById.get(node.id);
    if (!knownNode) {
      throw new Error(t.unknownTreeNode);
    }

    visited.push(knownNode.id);
    trace.push({
      step: trace.length + 1,
      action: `tree.visit(${knownNode.id})`,
      state: {
        current: knownNode.id,
        visited: [...visited],
      },
      note: t.treeVisited(knownNode.value),
    });
  };

  const tree = {
    root: level.tree,
    visit: addVisit,
  };

  return runTraversalProgram(code, level, locale, "tree", tree, trace, visited);
}

function runTraversalProgram(
  code: string,
  level: Extract<Level, { kind: "matrix" | "tree" }>,
  locale: Locale,
  argumentName: "matrix" | "tree",
  argument: unknown,
  trace: TraceEntry[],
  visited: string[],
): RunResult {
  const t = runnerCopy[locale];

  try {
    const userProgram = new Function(
      argumentName,
      "log",
      `${code}

if (typeof solve !== "function") {
  throw new Error(${JSON.stringify(t.defineSolve)});
}

solve(${argumentName});`,
    );

    const log = (message: string) => {
      if (trace.length >= maxSteps) {
        throw new Error(t.tooManyActions);
      }

      trace.push({
        step: trace.length + 1,
        action: "log()",
        state: {
          current: visited.at(-1),
          visited: [...visited],
        },
        note: String(message),
      });
    };

    userProgram(argument, log);

    if (sameItems(visited, level.expectedVisited)) {
      return {
        status: "passed",
        message: t.traversalPassed(level.name),
        trace,
      };
    }

    return {
      status: "failed",
      message: t.traversalFailed(visited, level.expectedVisited),
      trace,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : t.unknownError,
      trace,
    };
  }
}

function collectTreeNodes(node: TreeNodeData, nodesById: Map<string, TreeNodeData>) {
  nodesById.set(node.id, node);
  node.children?.forEach((child) => collectTreeNodes(child, nodesById));
}

function sameItems(actual: string[], expected: string[]) {
  return actual.length === expected.length && actual.every((item, index) => item === expected[index]);
}

function formatItems(items: string[]) {
  return items.length === 0 ? "empty" : items.join(", ");
}

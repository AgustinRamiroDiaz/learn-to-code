import type { Level, RunResult, TraceEntry } from "./types";

type RunRequest = {
  code: string;
  level: Level;
};

const maxSteps = 40;

self.onmessage = (event: MessageEvent<RunRequest>) => {
  const result = runUserCode(event.data.code, event.data.level);
  self.postMessage(result);
};

function runUserCode(code: string, level: Level): RunResult {
  const trace: TraceEntry[] = [];
  const state = {
    ...level.start,
  };

  const addTrace = (action: string, note: string) => {
    if (trace.length >= maxSteps) {
      throw new Error(`Too many actions. Keep the solution under ${maxSteps} steps.`);
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
      throw new Error("moveRight() would leave the field.");
    }

    state.x += 1;
    addTrace("moveRight()", `Moved to x=${state.x}.`);
  };

  const moveLeft = () => {
    if (state.x - 1 < 0) {
      throw new Error("moveLeft() would leave the field.");
    }

    state.x -= 1;
    addTrace("moveLeft()", `Moved to x=${state.x}.`);
  };

  const moveUp = () => {
    if (state.y + 1 >= level.height) {
      throw new Error("moveUp() would leave the field.");
    }

    state.y += 1;
    addTrace("moveUp()", `Moved to y=${state.y}.`);
  };

  const moveDown = () => {
    if (state.y - 1 < 0) {
      throw new Error("moveDown() would leave the field.");
    }

    state.y -= 1;
    addTrace("moveDown()", `Moved to y=${state.y}.`);
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
  throw new Error("Define a solve() function.");
}

solve();`,
    );

    userProgram(moveRight, moveLeft, moveUp, moveDown, log);

    if (state.x === level.goal.x && state.y === level.goal.y) {
      return {
        status: "passed",
        message: `${level.name} passed. The crop marker is reached.`,
        trace,
      };
    }

    return {
      status: "failed",
      message: `Not quite. Ended at x=${state.x}, y=${state.y}; goal is x=${level.goal.x}, y=${level.goal.y}.`,
      trace,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown runtime error.",
      trace,
    };
  }
}

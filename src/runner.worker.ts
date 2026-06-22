import type { RunResult, TraceEntry } from "./types";

type RunRequest = {
  code: string;
};

const maxSteps = 40;

self.onmessage = (event: MessageEvent<RunRequest>) => {
  const result = runUserCode(event.data.code);
  self.postMessage(result);
};

function runUserCode(code: string): RunResult {
  const trace: TraceEntry[] = [];
  const state = {
    x: 0,
    y: 0,
    coins: 0,
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
    state.x += 1;
    state.y = 0;
    addTrace("moveRight()", `Moved to x=${state.x}.`);
  };

  const jump = () => {
    if (state.y > 0) {
      throw new Error("You are already in the air.");
    }

    state.y = 1;
    addTrace("jump()", "Jumped over the tile.");
  };

  const collectCoin = () => {
    if (state.x !== 2 || state.y !== 1) {
      throw new Error("The coin can only be collected at x=2 while jumping.");
    }

    state.coins += 1;
    addTrace("collectCoin()", "Collected the coin.");
  };

  const log = (message: string) => {
    addTrace("log()", String(message));
  };

  try {
    const userProgram = new Function(
      "moveRight",
      "jump",
      "collectCoin",
      "log",
      `${code}

if (typeof solve !== "function") {
  throw new Error("Define a solve() function.");
}

solve();`,
    );

    userProgram(moveRight, jump, collectCoin, log);

    if (state.x === 2 && state.y === 1 && state.coins === 1) {
      return {
        status: "passed",
        message: "Level passed. The coin is yours.",
        trace,
      };
    }

    return {
      status: "failed",
      message: `Not quite. Ended at x=${state.x}, y=${state.y}, coins=${state.coins}.`,
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

export type Diagnostic = {
  message: string;
  line: number;
  column: number;
  severity: "error" | "warning" | "info";
};

export type TraceEntry = {
  step: number;
  action: string;
  state: {
    x: number;
    y: number;
  };
  note: string;
};

export type RunResult = {
  status: "idle" | "running" | "passed" | "failed" | "error";
  message: string;
  trace: TraceEntry[];
};

export type Level = {
  id: string;
  name: string;
  objective: string;
  hint: string;
  starterCode: string;
  width: number;
  height: number;
  start: {
    x: number;
    y: number;
  };
  goal: {
    x: number;
    y: number;
  };
};

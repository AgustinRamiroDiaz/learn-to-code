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
    coins: number;
  };
  note: string;
};

export type RunResult = {
  status: "idle" | "running" | "passed" | "failed" | "error";
  message: string;
  trace: TraceEntry[];
};

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
    x?: number;
    y?: number;
    items?: string[];
    processed?: string[];
    current?: string;
    visited?: string[];
  };
  note: string;
};

export type RunResult = {
  status: "idle" | "running" | "passed" | "failed" | "error";
  message: string;
  trace: TraceEntry[];
};

type BaseLevel = {
  id: string;
  name: string;
  objective: string;
  hint: string;
  conceptTitle: string;
  concept: string[];
  starterCode: string;
};

export type GridLevel = BaseLevel & {
  kind: "grid";
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

type StructureBaseLevel = BaseLevel & {
  initialItems: string[];
  goalItems: string[];
  goalProcessed: string[];
};

export type StackLevel = StructureBaseLevel & {
  kind: "stack";
};

export type QueueLevel = StructureBaseLevel & {
  kind: "queue";
};

export type StructureLevel = StackLevel | QueueLevel;

type TraversalBaseLevel = BaseLevel & {
  expectedVisited: string[];
};

export type MatrixLevel = TraversalBaseLevel & {
  kind: "matrix";
  matrix: string[][];
};

export type TreeNodeData = {
  id: string;
  value: string;
  children?: TreeNodeData[];
};

export type TreeLevel = TraversalBaseLevel & {
  kind: "tree";
  tree: TreeNodeData;
};

export type TraversalLevel = MatrixLevel | TreeLevel;

export type Level = GridLevel | StackLevel | QueueLevel | MatrixLevel | TreeLevel;

export type Locale = "en" | "es";

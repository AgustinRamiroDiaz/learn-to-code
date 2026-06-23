import { copy } from "./i18n";
import type { Level, Locale, RunResult } from "./types";

export function levelTitle(name: string) {
  return name.replace(/^(Level|Nivel) \d+: /, "");
}

export function goalSummary(level: Level, t: (typeof copy)[Locale]) {
  if (level.kind === "grid") {
    return `${t.goalTile}: x=${level.goal.x}, y=${level.goal.y}`;
  }

  if (level.kind === "stack") {
    return t.stackGoal;
  }

  if (level.kind === "queue") {
    return t.queueGoal;
  }

  return level.kind === "matrix" ? t.matrixGoal : t.treeGoal;
}

export function traceState(
  state: RunResult["trace"][number]["state"],
  t: (typeof copy)[Locale],
) {
  if (typeof state.x === "number" && typeof state.y === "number") {
    return `x=${state.x}, y=${state.y}`;
  }

  if (state.visited) {
    return `${t.current}: ${state.current ?? "[]"} | ${t.visited}: ${formatStateItems(state.visited)}`;
  }

  return `${t.remaining}: ${formatStateItems(state.items)} | ${t.processed}: ${formatStateItems(state.processed)}`;
}

function formatStateItems(items?: string[]) {
  return items && items.length > 0 ? items.join(", ") : "[]";
}

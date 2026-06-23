import { describe, expect, it } from "vitest";
import { copy } from "./i18n";
import type { RunResult } from "./types";
import { levelTitle, traceState } from "./uiUtils";

describe("uiUtils", () => {
  it("removes localized level prefixes", () => {
    expect(levelTitle("Level 7: Warehouse Scan")).toBe("Warehouse Scan");
    expect(levelTitle("Nivel 7: Escaneo de almacen")).toBe(
      "Escaneo de almacen",
    );
  });

  it("formats traversal trace state in the active locale", () => {
    const state: RunResult["trace"][number]["state"] = {
      current: "root",
      visited: ["root", "child"],
    };

    expect(traceState(state, copy.en)).toBe("current: root | visited: root, child");
    expect(traceState(state, copy.es)).toBe("actual: root | visitados: root, child");
  });
});

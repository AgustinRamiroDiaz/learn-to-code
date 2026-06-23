describe("level flow", () => {
  beforeEach(() => {
    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });
  });

  it("checks type errors, failed attempts, and a completed level", () => {
    cy.contains("TypeScript Minigame Lab").should("be.visible");
    cy.contains("Choose a level").should("be.visible");

    cy.contains("button", "Furrow East").click();

    cy.contains("Current level").should("be.visible");
    cy.contains("Furrow East").should("be.visible");

    cy.setEditorCode(`// e2e non-compilable attempt
const steps: number = "two";

function solve() {
  moveRight();
}
`);
    cy.contains("button", "Run").click();

    cy.contains("Needs work", { timeout: 20_000 }).should("be.visible");
    cy.contains("Fix the TypeScript errors before running the level.", {
      timeout: 20_000,
    }).should("be.visible");
    cy.contains("Diagnostics").should("be.visible");
    cy.contains("Type 'string' is not assignable to type 'number'.").should(
      "be.visible",
    );

    cy.setEditorCode(`// e2e incomplete attempt
function solve() {
  moveRight();
}
`);
    cy.contains("button", "Run").click();

    cy.contains("Needs work", { timeout: 20_000 }).should("be.visible");
    cy.contains("Not quite. Ended at x=1, y=1; goal is x=2, y=1.", {
      timeout: 20_000,
    }).should("be.visible");
    cy.contains(".panel", "Diagnostics").contains("0").should("be.visible");

    cy.setEditorCode(`// e2e solved attempt
function solve() {
  moveRight();
  moveRight();
}
`);
    cy.contains("button", "Run").click();

    cy.contains("Passed", { timeout: 20_000 }).should("be.visible");
    cy.contains("Furrow East passed. The crop marker is reached.", {
      timeout: 20_000,
    }).should("be.visible");
    cy.contains("code", "moveRight()").should("be.visible");
  });
});

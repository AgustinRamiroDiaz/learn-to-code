describe("i18n", () => {
  beforeEach(() => {
    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });
  });

  it("localizes the selector, lab panels, tutorial, and starter code", () => {
    cy.contains("button", "ES").click();

    cy.contains("Elige un nivel").should("be.visible");
    cy.contains("Matriz de mercado").should("be.visible");
    cy.contains("Visita los puestos del mercado").should("be.visible");
    cy.contains("Empezar").should("be.visible");

    cy.contains("button", "Matriz de mercado").click();

    cy.contains("Nivel actual").should("be.visible");
    cy.contains("Matriz de mercado").should("be.visible");
    cy.contains("Objetivo del nivel").should("be.visible");
    cy.contains("Acceso a matrices").should("be.visible");
    cy.contains("Pista de la traza").should("be.visible");
    cy.contains("Ejecutar").should("be.visible");
    cy.contains("Reiniciar").should("be.visible");
    cy.contains("Diagnosticos").should("be.visible");
    cy.contains("Traza").should("be.visible");

    cy.get(".monaco-editor").shouldContainEditorText("API de matriz disponible");
    cy.get(".monaco-editor").shouldContainEditorText("Tu codigo aqui");

    cy.contains("button", "EN").click();

    cy.contains("Current level").should("be.visible");
    cy.contains("Market Matrix").should("be.visible");
    cy.contains("Matrix Access").should("be.visible");
    cy.contains("Trace hint").should("be.visible");
    cy.contains("Run").should("be.visible");
    cy.contains("Reset").should("be.visible");
    cy.contains("Diagnostics").should("be.visible");
    cy.contains("Trace").should("be.visible");

    cy.get(".monaco-editor").shouldContainEditorText("Available matrix API");
    cy.get(".monaco-editor").shouldContainEditorText("Your code here");
  });
});

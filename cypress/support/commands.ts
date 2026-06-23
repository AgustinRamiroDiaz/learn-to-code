Cypress.Commands.add("setEditorCode", (code: string) => {
  cy.window()
    .should((win) => {
      expect(win.__setMinigameCode).to.be.a("function");
    })
    .then((win) => {
      win.__setMinigameCode?.(code);
    });

  cy.get(".monaco-editor").should(($editor) => {
    expect($editor.text().replace(/\u00a0/g, " ")).to.include(
      code.trim().split("\n")[0],
    );
  });
});

Cypress.Commands.add(
  "shouldContainEditorText",
  { prevSubject: "element" },
  (subject, text: string) => {
    cy.wrap(subject).should(($editor) => {
      expect($editor.text().replace(/\u00a0/g, " ")).to.include(text);
    });
  },
);

declare global {
  interface Window {
    __setMinigameCode?: (code: string) => void;
  }

  namespace Cypress {
    interface Chainable {
      setEditorCode(code: string): Chainable<void>;
      shouldContainEditorText(text: string): Chainable<void>;
    }
  }
}

export {};

import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", "coverage"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.worker,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
      {
        files: ["cypress/**/*.ts"],
        languageOptions: {
          globals: {
            ...globals.browser,
        cy: "readonly",
        Cypress: "readonly",
        describe: "readonly",
        beforeEach: "readonly",
            it: "readonly",
          },
        },
        rules: {
          "@typescript-eslint/no-namespace": "off",
        },
      },
    );

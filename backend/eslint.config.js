const js = require("@eslint/js");
const globals = require("globals");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.es2022
      }
    },
    rules: {
      // Errors
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_|next|err",
          caughtErrors: "none",
          varsIgnorePattern: "^_"
        }
      ],
      "no-undef": "error",
      "no-console": "off",

      // Warnings
      "eqeqeq": ["warn", "always"],
      "no-var": "warn",
      "prefer-const": "warn"
    }
  },
  {
    ignores: ["node_modules/**", "dist/**", "coverage/**"]
  }
];

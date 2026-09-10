import e18ePlugin from "@e18e/eslint-plugin";
import jsPlugin from "@eslint/js";
import jsonPlugin from "@eslint/json";
import markdownPlugin from "@eslint/markdown";
import eslintPlugin from "eslint-plugin-eslint-plugin";
import jsdocPlugin from "eslint-plugin-jsdoc";
import perfectionistPlugin from "eslint-plugin-perfectionist";
import sonarjsPlugin from "eslint-plugin-sonarjs";
import unicornPlugin from "eslint-plugin-unicorn";
import { defineConfig } from "eslint/config";
import tsPlugin from "typescript-eslint";

const jsdocConfig = [
  jsdocPlugin.configs["flat/recommended"],
  {
    rules: {
      "jsdoc/check-indentation": "warn",
      "jsdoc/check-line-alignment": "warn",
      "jsdoc/check-syntax": "warn",
      "jsdoc/check-template-names": "warn",
      "jsdoc/imports-as-dependencies": "warn",
      "jsdoc/informative-docs": "warn",
      "jsdoc/lines-before-block": "warn",
      "jsdoc/match-description": "warn",
      "jsdoc/match-name": [
        "warn",
        {
          match: [
            {
              tags: ["param", "property"],
              allowName: "^[a-z$_][a-zA-Z0-9$_]*$",
              message:
                "JSDoc token names must be written in strict camelCase (e.g., 'myVariable').",
            },
          ],
        },
      ],
      "jsdoc/no-bad-blocks": "warn",
      "jsdoc/no-blank-block-descriptions": "warn",
      "jsdoc/no-blank-blocks": "warn",
      "jsdoc/normalize-see-links": "warn",
      "jsdoc/prefer-import-tag": "warn",
      "jsdoc/require-asterisk-prefix": "warn",
      "jsdoc/require-description": "warn",
      "jsdoc/require-description-complete-sentence": "warn",
      "jsdoc/require-hyphen-before-param-description": ["warn", "always"],
      "jsdoc/require-template": "warn",
      "jsdoc/require-throws": "warn",
      "jsdoc/require-yields-description": "warn",
      "jsdoc/ts-method-signature-style": "warn",
      "jsdoc/ts-no-unnecessary-template-expression": "warn",
      "jsdoc/ts-prefer-function-type": "warn",
    },
  },
  {
    files: ["**/*.js"],
    rules: {
      "jsdoc/no-types": "off",
      "jsdoc/require-param-type": "warn",
      "jsdoc/require-returns-type": "warn",
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      "jsdoc/no-types": "warn",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns-type": "off",
    },
  },
];

const jsAndTsConfig = [
  eslintPlugin.configs.recommended,
  ...jsdocConfig,
  jsPlugin.configs.recommended,
  {
    plugins: {
      e18e: e18ePlugin,
      perfectionist: perfectionistPlugin,
    },
    rules: {
      "e18e/prefer-timer-args": "error",
      "e18e/prefer-static-regex": "error",
      "e18e/prefer-get-or-insert": "error",

      "perfectionist/sort-imports": [
        "error",
        {
          type: "natural",
          order: "asc",
          groups: [
            // Built-in modules (e.g., node:fs, node:path)
            "builtin",
            // Third-party packages (e.g., react, vite)
            "external",
            // Absolute path aliases (@/, ~/) or subpath imports (e.g., #utils/).
            ["internal", "subpath"],
            // Relative imports (e.g. ../utils/deno.js, ./utils.ts, ./index).
            ["parent", "sibling", "index"],
            // Style imports.
            "style",
            // Anything that didn't match above.
            "unknown",
          ],
        },
      ],
      "perfectionist/sort-named-imports": [
        "error",
        {
          type: "natural",
          order: "asc",
        },
      ],
    },
  },
  sonarjsPlugin.configs.recommended,
  unicornPlugin.configs.recommended,
  {
    rules: {
      "unicorn/name-replacements": "off",
      "unicorn/no-nested-ternary": "off",
      "unicorn/no-null": "off",
    },
  },
];

export default defineConfig([
  {
    ignores: ["**/*", "!*.*", "!src/**"],
  },
  {
    files: ["./*.{js,ts}", "./src/**/*.{js,ts,jsx,tsx}"],
    settings: {
      react: {
        version: "detect",
      },
    },
    extends: jsAndTsConfig,
  },
  {
    files: ["./*.ts", "./src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    extends: [...tsPlugin.configs.strict, ...tsPlugin.configs.stylistic],
  },
  {
    files: ["./*.json", "./src/**/*.json"],
    language: "json/json",
    plugins: {
      e18e: e18ePlugin,
    },
    extends: [jsonPlugin.configs.recommended],
    rules: {
      "e18e/ban-dependencies": "error",
    },
  },
  {
    files: ["./*.md", "./src/**/*.md"],
    language: "markdown/commonmark",
    extends: [markdownPlugin.configs.recommended],
  },
]);

import type { ESLint, Linter } from "eslint";

import { enforceModBoundariesRule } from "./rules/mod.ts";

const recommendedConfig: Linter.Config[] = [
  {
    plugins: {
      "mod-boundaries": {},
    },
    files: ["{src,app}/**/*.{js,ts,jsx,tsx}"],
    ignores: ["**/*test*/**", "**/*.{spec,test}.{js,ts,jsx,tsx}"],
    rules: {
      "mod-boundaries/enforce-mod-boundaries": "error",
    },
  },
];

/**
 * The ESLint plugin for enforcing module boundaries.
 */
export const eslintPluginModBoundaries: ESLint.Plugin = {
  meta: {
    name: "eslint-plugin-mod-boundaries",
    version: "0.5.1",
  },
  rules: {
    "enforce-mod-boundaries": enforceModBoundariesRule,
  },
  configs: {
    recommended: recommendedConfig,
    all: recommendedConfig,
  },
};

if (recommendedConfig[0]) {
  recommendedConfig[0].plugins = {
    "mod-boundaries": eslintPluginModBoundaries,
  };
}

/**
 * Default export of the eslint-plugin-mod-boundaries plugin.
 */
export default eslintPluginModBoundaries;

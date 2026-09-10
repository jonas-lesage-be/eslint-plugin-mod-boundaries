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
] as const;

export const eslintPluginModBoundaries: ESLint.Plugin = {
  meta: {
    name: "eslint-plugin-mod-boundaries",
    version: "0.1.0",
  },
  rules: {
    "enforce-mod-boundaries": enforceModBoundariesRule,
  },
  configs: {
    recommended: recommendedConfig,
    all: recommendedConfig,
  },
};

recommendedConfig[0].plugins = {
  "mod-boundaries": eslintPluginModBoundaries,
};

export default eslintPluginModBoundaries;

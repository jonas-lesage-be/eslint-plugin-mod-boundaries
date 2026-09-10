import type { Rule } from "eslint";

export type ResolveContext = Rule.RuleContext & {
  settings?: ContextSettings;
};

interface ContextSettings {
  modBoundaries?: ModBoundariesSettings;
}

interface ModBoundariesSettings {
  alias?: string;
  aliasPath?: string;
}

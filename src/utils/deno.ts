import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { DenoConfig, DenoImports } from "@/models/deno-config.ts";
import type { ResolveContext } from "@/models/resolve-context.ts";

const state = {
  cachedDenoConfig: null as DenoImports | null,
  denoConfigAttempted: false,
};

/**
 * Reads and caches the imports map from the deno.json file.
 * @param cwd - The current working directory.
 * @returns The configured Deno imports, or null if not found or invalid.
 */
function getDenoImports(cwd: string): DenoImports | null {
  if (state.denoConfigAttempted) return state.cachedDenoConfig;
  state.denoConfigAttempted = true;

  const denoJsonPath = path.join(cwd, "deno.json");
  try {
    if (existsSync(denoJsonPath)) {
      const content = readFileSync(denoJsonPath, "utf8");
      const parsed: DenoConfig = JSON.parse(content);
      state.cachedDenoConfig = parsed.imports || null;
    }
  } catch {
    state.cachedDenoConfig = null;
  }

  return state.cachedDenoConfig;
}

/**
 * Resolves the configured alias, falling back to deno.json import "@/".
 * @param context - The plugin context object.
 * @returns The resolved alias and its target path.
 */
export function resolveAlias(context: ResolveContext): {
  alias: string | null;
  aliasTarget: string | null;
} {
  const settings = context.settings?.modBoundaries ?? {};
  let alias = settings?.alias ?? null;
  let aliasTarget = settings?.aliasPath ?? null;

  if (!alias || !aliasTarget) {
    const denoImports = getDenoImports(context.cwd);
    if (denoImports?.["@/"]) {
      alias = "@/";
      aliasTarget = denoImports["@/"];
    }
  }

  return { alias, aliasTarget };
}
